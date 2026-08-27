import re
import httpx
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from typing import List, Dict, Any
from app.core.ssrf import validate_url_safety

KNOWN_BRANDS = {
    "paypal": ["paypal.com", "paypal.me"],
    "google": ["google.com", "accounts.google.com"],
    "apple": ["apple.com", "appleid.apple.com"],
    "microsoft": ["microsoft.com", "live.com", "office.com"],
    "amazon": ["amazon.com", "aws.amazon.com"],
    "netflix": ["netflix.com"],
    "facebook": ["facebook.com", "fb.com"],
    "instagram": ["instagram.com"],
    "twitter": ["twitter.com", "x.com"],
    "chase": ["chase.com"],
    "bankofamerica": ["bankofamerica.com"],
}

HIGH_RISK_TLDS = {".xyz", ".top", ".club", ".work", ".click", ".gq", ".cf", ".tk", ".ml", ".ga", ".online", ".site", ".biz", ".country", ".kim", ".science", ".link"}

PHISHING_KEYWORDS = [
    "verify your account",
    "account suspended",
    "urgent action required",
    "login to continue",
    "update billing",
    "confirm password",
    "security alert",
    "authorize device",
    "unusual activity detected",
    "restore access"
]

class WebsiteAnalyzer:
    def __init__(self):
        self.headers = {
            "User-Agent": "IdentityTrace Security Inspection Engine/1.0 (+https://identitytrace.io)"
        }

    async def analyze(self, normalized_url: str, domain: str) -> Dict[str, Any]:
        """
        Executes safe SSRF-validated HTTP analysis and signal extraction.
        """
        signals: List[Dict[str, Any]] = []
        metadata: Dict[str, Any] = {
            "title": "",
            "status_code": None,
            "redirect_count": 0,
            "final_url": normalized_url,
            "has_ssl": normalized_url.startswith("https://")
        }

        # 1. URL Structural Analysis
        parsed = urlparse(normalized_url)
        hostname = parsed.hostname or domain

        # Check URL Length
        if len(normalized_url) > 75:
            signals.append({
                "signal_name": "Suspicious URL Length",
                "signal_category": "URL Structure",
                "detected": True,
                "weight": 15,
                "value": f"Length: {len(normalized_url)} characters",
                "explanation": "Excessively long URLs are often used to obfuscate true destinations in phishing campaigns.",
                "availability": "AVAILABLE"
            })

        # Check Subdomains Count
        subdomains = hostname.split(".")
        if len(subdomains) > 3:
            signals.append({
                "signal_name": "Excessive Subdomain Levels",
                "signal_category": "URL Structure",
                "detected": True,
                "weight": 20,
                "value": f"{len(subdomains) - 2} subdomain levels detected ({hostname})",
                "explanation": "Deep subdomain nesting is frequently used to impersonate legitimate brand URLs.",
                "availability": "AVAILABLE"
            })

        # Check IP-based Hostname
        if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", hostname):
            signals.append({
                "signal_name": "IP-Based Hostname Detection",
                "signal_category": "URL Structure",
                "detected": True,
                "weight": 25,
                "value": f"Host IP: {hostname}",
                "explanation": "Direct IP address URLs bypass standard domain name resolution and reputation monitoring.",
                "availability": "AVAILABLE"
            })

        # Check High Risk TLD
        for tld in HIGH_RISK_TLDS:
            if hostname.endswith(tld):
                signals.append({
                    "signal_name": "High-Risk Top Level Domain (TLD)",
                    "signal_category": "URL Structure",
                    "detected": True,
                    "weight": 15,
                    "value": f"TLD: {tld}",
                    "explanation": "Domain utilizes a top-level domain frequently associated with low-cost disposable phishing sites.",
                    "availability": "AVAILABLE"
                })
                break

        # Check Brand Typosquatting
        for brand, official_domains in KNOWN_BRANDS.items():
            if brand in hostname:
                is_official = any(hostname == off or hostname.endswith("." + off) for off in official_domains)
                if not is_official:
                    signals.append({
                        "signal_name": "Brand Impersonation / Typosquatting",
                        "signal_category": "URL Structure",
                        "detected": True,
                        "weight": 30,
                        "value": f"Impersonated Brand: {brand.capitalize()} (Host: {hostname})",
                        "explanation": f"The domain string contains '{brand}' but does not belong to official {brand.capitalize()} infrastructure.",
                        "availability": "AVAILABLE"
                    })
                    break

        # Check Missing HTTPS
        if not metadata["has_ssl"]:
            signals.append({
                "signal_name": "Unencrypted HTTP Scheme",
                "signal_category": "Domain & Technical",
                "detected": True,
                "weight": 20,
                "value": "Scheme: http://",
                "explanation": "Website lacks TLS/HTTPS encryption, posing data interception risks for users.",
                "availability": "AVAILABLE"
            })

        # 2. SSRF Validation & HTTP Page Content Signal Extraction
        try:
            safe_url = validate_url_safety(normalized_url)
            async with httpx.AsyncClient(timeout=6.0, follow_redirects=True, max_redirects=5, headers=self.headers) as client:
                response = await client.get(safe_url)
                metadata["status_code"] = response.status_code
                metadata["final_url"] = str(response.url)
                metadata["redirect_count"] = len(response.history)

                if len(response.history) > 1:
                    signals.append({
                        "signal_name": "Multiple HTTP Redirect Chain",
                        "signal_category": "Domain & Technical",
                        "detected": True,
                        "weight": 15,
                        "value": f"{len(response.history)} redirects to {metadata['final_url']}",
                        "explanation": "Redirect chains can mask final landing destinations from initial threat scanners.",
                        "availability": "AVAILABLE"
                    })

                # Page Content Analysis
                html_text = response.text
                soup = BeautifulSoup(html_text, "html.parser")
                
                page_title = soup.title.string.strip() if soup.title and soup.title.string else ""
                metadata["title"] = page_title

                # Check for Password / Credential Input Fields
                password_inputs = soup.find_all("input", {"type": "password"})
                if password_inputs:
                    signals.append({
                        "signal_name": "Credential Input Form Detected",
                        "signal_category": "Content & Page",
                        "detected": True,
                        "weight": 20,
                        "value": f"Found {len(password_inputs)} password input field(s)",
                        "explanation": "Page contains credential login forms requiring heightened verification for brand legitimacy.",
                        "availability": "AVAILABLE"
                    })

                # Check Phishing Keywords in Body Text
                body_text = soup.get_text().lower()
                matched_keywords = [kw for kw in PHISHING_KEYWORDS if kw in body_text]
                if matched_keywords:
                    signals.append({
                        "signal_name": "Suspicious Authentication / Urgency Patterns",
                        "signal_category": "Content & Page",
                        "detected": True,
                        "weight": 25,
                        "value": f"Matched Keywords: {', '.join(matched_keywords[:3])}",
                        "explanation": "Page text contains high-urgency language commonly found in social engineering & credential harvesting campaigns.",
                        "availability": "AVAILABLE"
                    })

                # Check Brand Title Mismatch
                if page_title:
                    title_lower = page_title.lower()
                    for brand, official_domains in KNOWN_BRANDS.items():
                        if brand in title_lower:
                            is_official = any(hostname == off or hostname.endswith("." + off) for off in official_domains)
                            if not is_official:
                                signals.append({
                                    "signal_name": "Brand Title vs Domain Mismatch",
                                    "signal_category": "Content & Page",
                                    "detected": True,
                                    "weight": 30,
                                    "value": f"Title refers to '{brand.capitalize()}', Domain is '{hostname}'",
                                    "explanation": f"Page title claims identity of {brand.capitalize()} while hosted on unrelated domain infrastructure.",
                                    "availability": "AVAILABLE"
                                })

        except Exception as err:
            # Inspection connection error or timeout -> record cleanly as unavailable or HTTP error
            signals.append({
                "signal_name": "Remote Page Content Inspection",
                "signal_category": "Content & Page",
                "detected": False,
                "weight": 0,
                "value": f"Connection Note: {str(err)}",
                "explanation": "Could not inspect remote page DOM content due to server timeout or network access restriction.",
                "availability": "UNAVAILABLE"
            })

        return {
            "signals": signals,
            "metadata": metadata
        }
