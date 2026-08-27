import io
import hashlib
import httpx
from typing import Optional, Tuple, Dict, Any

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

def compute_dhash_from_bytes(image_bytes: bytes) -> Optional[str]:
    """
    Computes a 64-bit difference hash (dHash) string for visual image perceptual matching.
    """
    if not HAS_PIL or not image_bytes:
        # Fallback to MD5 hex if Pillow is unavailable
        return hashlib.md5(image_bytes).hexdigest() if image_bytes else None

    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("L")
        img = img.resize((9, 8), Image.Resampling.LANCZOS)
        
        pixels = list(img.getdata())
        difference = []
        for row in range(8):
            for col in range(8):
                pixel_left = pixels[row * 9 + col]
                pixel_right = pixels[row * 9 + col + 1]
                difference.append(pixel_left > pixel_right)

        # Convert boolean list to 16-character hex string
        decimal_val = 0
        for bit in difference:
            decimal_val = (decimal_val << 1) | int(bit)
        return f"{decimal_val:016x}"
    except Exception:
        return hashlib.md5(image_bytes).hexdigest() if image_bytes else None

def hamming_distance(hash1: str, hash2: str) -> int:
    """Calculates Hamming distance between two hex hash strings of equal length."""
    if not hash1 or not hash2 or len(hash1) != len(hash2):
        return 64  # max distance
    try:
        val1 = int(hash1, 16)
        val2 = int(hash2, 16)
        xor_val = val1 ^ val2
        return bin(xor_val).count('1')
    except Exception:
        return 64

def calculate_image_similarity_percentage(hash1: str, hash2: str) -> float:
    """
    Converts Hamming distance of 64-bit dHash into 0.0 - 1.0 similarity ratio.
    Distance 0 = 100% match.
    Distance <= 12 = high visual similarity (>= 81% match).
    """
    if not hash1 or not hash2:
        return 0.0
    if hash1 == hash2:
        return 1.0

    dist = hamming_distance(hash1, hash2)
    similarity = max(0.0, 1.0 - (dist / 64.0))
    return round(similarity, 2)

async def fetch_and_hash_image(image_url: str) -> Tuple[Optional[str], Optional[bytes]]:
    """Downloads image safely and returns (hash_string, raw_bytes)."""
    if not image_url or not image_url.startswith(("http://", "https://")):
        return None, None

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) IdentityTrace Image Analyzer/1.0"
    }

    try:
        async with httpx.AsyncClient(timeout=5.0, follow_redirects=True, headers=headers) as client:
            response = await client.get(image_url)
            if response.status_code == 200 and len(response.content) > 100:
                img_bytes = response.content
                hash_val = compute_dhash_from_bytes(img_bytes)
                return hash_val, img_bytes
    except Exception:
        pass
    return None, None
