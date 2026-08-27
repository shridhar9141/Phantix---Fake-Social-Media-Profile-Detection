import re
from urllib.parse import urlparse
from typing import Dict, Any

SUPPORTED_SOCIAL_DOMAINS = {
    "instagram.com": "Instagram",
    "www.instagram.com": "Instagram",
    "facebook.com": "Facebook",
    "www.facebook.com": "Facebook",
    "fb.com": "Facebook",
    "linkedin.com": "LinkedIn",
    "www.linkedin.com": "LinkedIn",
    "x.com": "X / Twitter",
    "www.x.com": "X / Twitter",
    "twitter.com": "X / Twitter",
    "www.twitter.com": "X / Twitter",
    "github.com": "GitHub",
    "www.github.com": "GitHub",
    "tiktok.com": "TikTok",
    "www.tiktok.com": "TikTok",
    "reddit.com": "Reddit",
    "www.reddit.com": "Reddit",
}

class URLClassifier:
    @staticmethod
    def normalize_url(raw_url: str) -> str:
        """
        Normalizes input URL: ensures http/https scheme, strips trailing whitespace and redundant slashes.
        If input is a username handle (e.g. @username or plain username without dot/scheme), formats as Instagram profile URL.
        """
        if not raw_url:
            return ""
        url = raw_url.strip()

        # Handle username starting with @
        if url.startswith("@"):
            clean_handle = url.lstrip("@").strip()
            return f"https://www.instagram.com/{clean_handle}/"

        # Handle plain username without protocol, dots, or slashes (e.g. 'nnddnn_09')
        if not (url.startswith("http://") or url.startswith("https://")):
            if "/" not in url and "." not in url and re.match(r"^[a-zA-Z0-9_\.]+$", url):
                return f"https://www.instagram.com/{url}/"
            url = "https://" + url

        parsed = urlparse(url)
        scheme = parsed.scheme.lower()
        netloc = parsed.netloc.lower()
        path = parsed.path.rstrip("/")

        clean_netloc = netloc.replace("www.", "")
        if (netloc in SUPPORTED_SOCIAL_DOMAINS or clean_netloc in SUPPORTED_SOCIAL_DOMAINS) and path and "/" not in path.strip("/"):
            normalized = f"{scheme}://{netloc}{path}/"
        else:
            normalized = f"{scheme}://{netloc}{path}"

        if parsed.query:
            normalized += f"?{parsed.query}"
        return normalized

    @classmethod
    def classify(cls, raw_url: str) -> Dict[str, Any]:
        """
        Classifies input URL or username into SOCIAL_PROFILE or WEBSITE and extracts domain + platform name.
        """
        normalized_url = cls.normalize_url(raw_url)
        parsed = urlparse(normalized_url)
        domain = parsed.hostname.lower() if parsed.hostname else ""

        clean_domain = domain.replace("www.", "") if domain.startswith("www.") else domain

        platform = "Website"
        entity_type = "WEBSITE"
        extracted_identifier = None

        for soc_domain, soc_platform in SUPPORTED_SOCIAL_DOMAINS.items():
            if domain == soc_domain or clean_domain == soc_domain.replace("www.", ""):
                path_parts = [p for p in parsed.path.strip("/").split("/") if p]
                if path_parts and path_parts[0] not in ["login", "register", "about", "privacy", "terms", "explore", "home"]:
                    entity_type = "SOCIAL_PROFILE"
                    platform = soc_platform
                    extracted_identifier = path_parts[0]
                    break

        return {
            "original_url": raw_url,
            "normalized_url": normalized_url,
            "domain": clean_domain,
            "full_domain": domain,
            "entity_type": entity_type,
            "platform": platform,
            "path": parsed.path,
            "extracted_identifier": extracted_identifier or clean_domain.replace(".", "_")
        }

def classify_url(raw_url: str) -> Dict[str, Any]:
    return URLClassifier.classify(raw_url)

