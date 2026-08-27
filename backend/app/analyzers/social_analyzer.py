import re
from urllib.parse import urlparse
from typing import List, Dict, Any, Optional
from difflib import SequenceMatcher

try:
    from rapidfuzz import fuzz
    HAS_RAPIDFUZZ = True
except ImportError:
    HAS_RAPIDFUZZ = False

from app.providers.social_provider import InstagramProvider, SocialProfile
from app.analyzers.image_similarity import calculate_image_similarity_percentage

def calculate_str_similarity(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    if HAS_RAPIDFUZZ:
        return round(fuzz.ratio(a.lower().strip(), b.lower().strip()) / 100.0, 2)
    return round(SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio(), 2)

SUSPICIOUS_PROFILE_KEYWORDS = [
    "support", "official", "helpdesk", "security", "verify", "customer_service", "billing", "recovery", "admin", "tech_support"
]

KNOWN_BRANDS = ["paypal", "apple", "microsoft", "google", "amazon", "netflix", "chase", "binance", "metamask", "coinbase", "instagram", "meta", "whatsapp"]

FAKE_DISPLAY_KEYWORDS = [
    "fake account", "fake profile", "fake id", "fake", "spam account", "spam", "backup account", 
    "backup", "burner", "troll", "bot", "temp account", "2nd account", "imposter", 
    "parody", "fanpage", "anon", "anonymous", "hacked", "giveaway", "dm for promo", "dump account", "stalker"
]

FAKE_BIO_KEYWORDS = [
    "fake account", "fake profile", "fake id", "fake", "backup account", "spam account", "burner", 
    "dm for promo", "dm for collabs", "sugar daddy", "sugar baby", "cashapp", "telegram", 
    "whatsapp me", "drop your pin", "free followers", "crypto", "forex", "dating", "onlyfans", "cash app"
]

FAKE_USERNAME_KEYWORDS = [
    "fake", "spam", "burner", "troll", "imposter", "backup", "dump", "anon", "bot"
]

class SocialProfileAnalyzer:
    def __init__(self):
        self.instagram_provider = InstagramProvider()

    async def analyze(self, normalized_url: str, platform: str, db: Any = None, profile_obj: Any = None) -> Dict[str, Any]:
        """
        Analyzes social profile handle structure, display name, bio text, audience metrics,
        brand impersonation cues, and automated fake/bot indicators.
        Queries configured SocialDataProvider (InstagramProvider) with database cache fallback.
        """
        signals: List[Dict[str, Any]] = []

        # 1. Fetch Real Data from SocialDataProvider
        if platform.lower() == "instagram":
            social_profile = await self.instagram_provider.get_profile(normalized_url, db=db)
        else:
            # Fallback for generic social profiles
            parsed = urlparse(normalized_url)
            path_parts = [p for p in parsed.path.split("/") if p]
            handle = path_parts[0] if path_parts else "unknown"
            if handle.startswith("@"):
                handle = handle[1:]
            
            social_profile = SocialProfile(
                platform=platform,
                username=handle,
                profile_url=normalized_url,
                availability={
                    "username": "AVAILABLE",
                    "profile_url": "AVAILABLE",
                    "platform": "AVAILABLE",
                    "display_name": "UNAVAILABLE",
                    "bio": "UNAVAILABLE",
                    "profile_image_url": "UNAVAILABLE",
                    "followers_count": "UNAVAILABLE",
                    "following_count": "UNAVAILABLE",
                    "posts_count": "UNAVAILABLE"
                },
                status_message="Platform data source limited."
            )

        # Merge with profile_obj if provided and live fields are empty
        if profile_obj is not None:
            if not social_profile.display_name and getattr(profile_obj, "display_name", None):
                social_profile.display_name = profile_obj.display_name
                social_profile.availability["display_name"] = "AVAILABLE"
            if (not social_profile.bio or social_profile.bio == "No public bio provided.") and getattr(profile_obj, "bio", None):
                social_profile.bio = profile_obj.bio
                social_profile.availability["bio"] = "AVAILABLE"
            if social_profile.followers_count is None and getattr(profile_obj, "followers_count", None) is not None:
                social_profile.followers_count = profile_obj.followers_count
                social_profile.availability["followers_count"] = "AVAILABLE"
            if social_profile.following_count is None and getattr(profile_obj, "following_count", None) is not None:
                social_profile.following_count = profile_obj.following_count
                social_profile.availability["following_count"] = "AVAILABLE"
            if social_profile.posts_count is None and getattr(profile_obj, "posts_count", None) is not None:
                social_profile.posts_count = profile_obj.posts_count
                social_profile.availability["posts_count"] = "AVAILABLE"
            if not social_profile.profile_image_url and getattr(profile_obj, "profile_image_url", None):
                social_profile.profile_image_url = profile_obj.profile_image_url
                social_profile.availability["profile_image_url"] = "AVAILABLE"

        username = social_profile.username or ""
        handle_lower = username.lower()
        display_name = social_profile.display_name or ""
        display_name_lower = display_name.lower().strip()
        bio = social_profile.bio or ""
        bio_lower = bio.lower().strip()

        metadata: Dict[str, Any] = {
            "platform": social_profile.platform,
            "handle": f"@{username}" if username else "Unknown Handle",
            "username": username,
            "url": social_profile.profile_url,
            "display_name": social_profile.display_name,
            "bio": social_profile.bio,
            "profile_image_url": social_profile.profile_image_url,
            "followers_count": social_profile.followers_count,
            "following_count": social_profile.following_count,
            "posts_count": social_profile.posts_count,
            "availability": social_profile.availability,
            "status_message": social_profile.status_message,
            "profile_data": social_profile.__dict__
        }

        # 2. Check Explicit Fake/Spam/Bot Indicators in Display Name
        matched_dn_fake = [kw for kw in FAKE_DISPLAY_KEYWORDS if kw in display_name_lower]
        if matched_dn_fake:
            signals.append({
                "signal_name": "Fake Account Indicator in Display Name",
                "signal_category": "Profile & Identity",
                "detected": True,
                "weight": 50,
                "value": f"Matched in Display Name: '{', '.join(matched_dn_fake)}'",
                "explanation": f"Profile display name '{display_name}' explicitly matches fake account / spam / impersonator keywords ({', '.join(matched_dn_fake)}).",
                "availability": "AVAILABLE"
            })
        else:
            signals.append({
                "signal_name": "Fake Account Indicator in Display Name",
                "signal_category": "Profile & Identity",
                "detected": False,
                "weight": 0,
                "value": "Clean display name",
                "explanation": "No suspicious fake or spam keywords detected in display name.",
                "availability": "AVAILABLE" if display_name else "UNAVAILABLE"
            })

        # 3. Check Explicit Fake / Spam / Solicitation Keywords in Bio
        matched_bio_fake = [kw for kw in FAKE_BIO_KEYWORDS if kw in bio_lower]
        if matched_bio_fake:
            signals.append({
                "signal_name": "Suspicious / Fake Profile Keywords in Bio",
                "signal_category": "Content & Page",
                "detected": True,
                "weight": 35,
                "value": f"Matched in Bio: '{', '.join(matched_bio_fake)}'",
                "explanation": f"Profile bio text contains suspicious solicitation, spam, or fake account indicator keywords ({', '.join(matched_bio_fake)}).",
                "availability": "AVAILABLE"
            })
        else:
            signals.append({
                "signal_name": "Suspicious / Fake Profile Keywords in Bio",
                "signal_category": "Content & Page",
                "detected": False,
                "weight": 0,
                "value": "No fake bio keywords",
                "explanation": "Profile bio does not contain obvious fake account or spam solicitation patterns.",
                "availability": "AVAILABLE" if bio else "UNAVAILABLE"
            })

        # 4. Check Bio Syntax & Repetitive Character Anomaly
        if bio and re.search(r"[_\-\*~=]{4,}", bio):
            signals.append({
                "signal_name": "Bio Formatting & Syntax Anomaly",
                "signal_category": "Content & Page",
                "detected": True,
                "weight": 15,
                "value": "Excessive repetitive character dividers detected in bio",
                "explanation": "Profile bio contains abnormal repetitive underline/symbol divider formatting commonly observed in burner or spam profiles.",
                "availability": "AVAILABLE"
            })
        else:
            signals.append({
                "signal_name": "Bio Formatting & Syntax Anomaly",
                "signal_category": "Content & Page",
                "detected": False,
                "weight": 0,
                "value": "Standard bio syntax",
                "explanation": "Bio formatting is standard without abnormal divider sequences.",
                "availability": "AVAILABLE" if bio else "UNAVAILABLE"
            })

        # 5. Check Suspicious Profile Handle Keywords (e.g. fake, spam, backup, anon)
        if username:
            matched_user_fake = [kw for kw in FAKE_USERNAME_KEYWORDS if kw in handle_lower]
            matched_keywords = [kw for kw in SUSPICIOUS_PROFILE_KEYWORDS if kw in handle_lower]
            
            if matched_user_fake:
                signals.append({
                    "signal_name": "Fake / Secondary Handle Indicator",
                    "signal_category": "Profile & Identity",
                    "detected": True,
                    "weight": 35,
                    "value": f"Matched Handle Keywords: {', '.join(matched_user_fake)}",
                    "explanation": f"Social profile handle '@{username}' contains keywords ({', '.join(matched_user_fake)}) typical of secondary, backup, or fake accounts.",
                    "availability": "AVAILABLE"
                })

            if matched_keywords:
                signals.append({
                    "signal_name": "Support / Official Impersonation Keywords",
                    "signal_category": "Profile & Identity",
                    "detected": True,
                    "weight": 30,
                    "value": f"Matched Handle Keywords: {', '.join(matched_keywords)}",
                    "explanation": f"Social profile handle '@{username}' uses authority words like 'official' or 'support' commonly used in imposter accounts.",
                    "availability": "AVAILABLE"
                })
            else:
                signals.append({
                    "signal_name": "Support / Official Impersonation Keywords",
                    "signal_category": "Profile & Identity",
                    "detected": False,
                    "weight": 0,
                    "value": "No support/official keywords",
                    "explanation": "No suspicious support or official keywords detected in username.",
                    "availability": "AVAILABLE"
                })

            # 6. Check Brand Impersonation in Profile Handle
            brand_detected = False
            for brand in KNOWN_BRANDS:
                if brand in handle_lower:
                    brand_detected = True
                    signals.append({
                        "signal_name": "Brand Name in Social Handle",
                        "signal_category": "Profile & Identity",
                        "detected": True,
                        "weight": 30,
                        "value": f"Matched Brand: '{brand.capitalize()}' in handle '@{username}'",
                        "explanation": f"Profile handle contains '{brand}', presenting high likelihood of brand spoofing or unauthorized channel.",
                        "availability": "AVAILABLE"
                    })
                    break

            if not brand_detected:
                signals.append({
                    "signal_name": "Brand Name in Social Handle",
                    "signal_category": "Profile & Identity",
                    "detected": False,
                    "weight": 0,
                    "value": "No known brand matched in handle",
                    "explanation": "No major brand names detected in profile handle.",
                    "availability": "AVAILABLE"
                })

            # 7. Check Suspicious Digits & Random Character Formatting
            digit_count = sum(c.isdigit() for c in username)
            if digit_count >= 4 or re.search(r"\d{3,}$", username):
                signals.append({
                    "signal_name": "Excessive Random Digit Pattern",
                    "signal_category": "Profile & Identity",
                    "detected": True,
                    "weight": 20,
                    "value": f"Handle contains {digit_count} numeric digits",
                    "explanation": "Random numerical suffixes are characteristic of automated bot profile creation scripts.",
                    "availability": "AVAILABLE"
                })
            else:
                signals.append({
                    "signal_name": "Excessive Random Digit Pattern",
                    "signal_category": "Profile & Identity",
                    "detected": False,
                    "weight": 0,
                    "value": f"{digit_count} digits in handle",
                    "explanation": "Username digit pattern is within normal distribution.",
                    "availability": "AVAILABLE"
                })

        # 8. Check Follower / Following Audience Pattern Signal
        f_cnt = social_profile.followers_count
        fg_cnt = social_profile.following_count
        p_cnt = social_profile.posts_count
        if f_cnt is not None and fg_cnt is not None:
            ratio = fg_cnt / max(f_cnt, 1)
            if ratio >= 3.0 and f_cnt < 150:
                signals.append({
                    "signal_name": "Burner / Throwaway Following Disproportion",
                    "signal_category": "Audience & Engagement",
                    "detected": True,
                    "weight": 35,
                    "value": f"Following: {fg_cnt:,} | Followers: {f_cnt:,} (Ratio: {ratio:.1f}x)",
                    "explanation": f"Burner Profile Pattern: Account follows {fg_cnt:,} users (nearly {ratio:.1f}x its audience of {f_cnt:,} followers), a classic signature of throwaway, lurker, or scraper burner accounts.",
                    "availability": "AVAILABLE"
                })
            elif fg_cnt > 1000 and ratio > 1.8:
                signals.append({
                    "signal_name": "Audience Pattern Anomaly (Mass Following)",
                    "signal_category": "Audience & Engagement",
                    "detected": True,
                    "weight": 30,
                    "value": f"Following: {fg_cnt:,} | Followers: {f_cnt:,} (Ratio: {ratio:.1f})",
                    "explanation": f"Mass-Following Anomaly: Account follows {fg_cnt:,} users (more than {ratio:.1f}x its {f_cnt:,} followers), indicative of automated follow-unfollow bot scripts or spam networking.",
                    "availability": "AVAILABLE"
                })
            elif fg_cnt > 500 and f_cnt < 50:
                signals.append({
                    "signal_name": "Audience Pattern Anomaly (Mass Following)",
                    "signal_category": "Audience & Engagement",
                    "detected": True,
                    "weight": 35,
                    "value": f"Following: {fg_cnt:,} | Followers: {f_cnt:,} (Ratio: {ratio:.1f})",
                    "explanation": "Severe Audience Disproportion: Account follows hundreds of accounts with virtually zero audience, characteristic of newly generated bot accounts.",
                    "availability": "AVAILABLE"
                })
            elif ratio > 2.5 and fg_cnt > 150:
                signals.append({
                    "signal_name": "Audience Pattern Anomaly (Mass Following)",
                    "signal_category": "Audience & Engagement",
                    "detected": True,
                    "weight": 25,
                    "value": f"Following: {fg_cnt:,} | Followers: {f_cnt:,} (Ratio: {ratio:.1f})",
                    "explanation": "Elevated Following Ratio: Disproportionate following count compared to follower base.",
                    "availability": "AVAILABLE"
                })
            else:
                signals.append({
                    "signal_name": "Audience Pattern Anomaly (Mass Following)",
                    "signal_category": "Audience & Engagement",
                    "detected": False,
                    "weight": 0,
                    "value": f"Followers: {f_cnt:,} | Following: {fg_cnt:,} (Ratio: {ratio:.1f})",
                    "explanation": "Audience Pattern: Follower-to-following ratio is within typical authentic profile parameters.",
                    "availability": "AVAILABLE"
                })

            # Check Low Organic Post Activity with Disproportionate Ratio
            if p_cnt is not None and p_cnt <= 5 and f_cnt < 100 and ratio > 2.0:
                signals.append({
                    "signal_name": "Low Organic Activity & Throwaway Signature",
                    "signal_category": "Content & Page",
                    "detected": True,
                    "weight": 25,
                    "value": f"Total Posts: {p_cnt} | Followers: {f_cnt} | Following: {fg_cnt}",
                    "explanation": f"Throwaway Profile Signature: Account has only {p_cnt} post(s) with minimal followers ({f_cnt}) but follows {fg_cnt} users.",
                    "availability": "AVAILABLE"
                })
        else:
            signals.append({
                "signal_name": "Audience Pattern Anomaly (Mass Following)",
                "signal_category": "Audience & Engagement",
                "detected": False,
                "weight": 0,
                "value": "Follower/Following metrics unavailable",
                "explanation": "Audience pattern metrics not returned by data source.",
                "availability": "UNAVAILABLE"
            })

        # 9. Check External Redirection Links in Bio
        url_pattern = re.compile(r'https?://[^\s]+')
        found_urls = url_pattern.findall(bio)
        if found_urls:
            suspicious_domains = ["bit.ly", "tinyurl.com", "t.co", "ngrok.io", "xyz", "top", "gq", "click", "linktr.ee"]
            if any(sd in url.lower() for url in found_urls for sd in suspicious_domains):
                signals.append({
                    "signal_name": "Suspicious External Link in Bio",
                    "signal_category": "Reputation & External",
                    "detected": True,
                    "weight": 25,
                    "value": f"Matched URL: {found_urls[0]}",
                    "explanation": "Profile bio contains a shortened, dynamic tunnel, or high-risk domain redirection link.",
                    "availability": "AVAILABLE"
                })

        # 10. Check Cross-Profile DB Similarity & Clones
        if db is not None and username:
            try:
                from app.models.profile import Profile
                existing_profiles = db.query(Profile).filter(Profile.username != username).all()

                max_user_sim = 0.0
                max_user_other = None
                max_img_sim = 0.0
                max_img_other = None

                curr_img_hash = None
                if profile_obj and isinstance(profile_obj.raw_data, dict):
                    curr_img_hash = profile_obj.raw_data.get("image_hash")

                for other in existing_profiles:
                    sim_u = calculate_str_similarity(username, other.username)
                    if sim_u > max_user_sim:
                        max_user_sim = sim_u
                        max_user_other = other

                    other_raw = other.raw_data if isinstance(other.raw_data, dict) else {}
                    other_img_hash = other_raw.get("image_hash")
                    if curr_img_hash and other_img_hash:
                        sim_img = calculate_image_similarity_percentage(curr_img_hash, other_img_hash)
                        if sim_img > max_img_sim:
                            max_img_sim = sim_img
                            max_img_other = other.username

                # Flag high-similarity clone / imposter (e.g. st_saina vs ist_saina)
                if max_user_sim >= 0.85 and max_user_other:
                    other_is_fake = False
                    other_dn = (max_user_other.display_name or "").lower()
                    if any(kw in other_dn for kw in FAKE_DISPLAY_KEYWORDS) or (max_user_other.username and any(kw in max_user_other.username.lower() for kw in FAKE_USERNAME_KEYWORDS)):
                        other_is_fake = True

                    signals.append({
                        "signal_name": "Cross-Profile Clone / Impersonation Signature",
                        "signal_category": "Profile & Identity",
                        "detected": True,
                        "weight": 35,
                        "value": f"Similarity: {int(max_user_sim*100)}% with '@{max_user_other.username}'",
                        "explanation": f"High handle similarity ({int(max_user_sim*100)}%) with entity '@{max_user_other.username}'" + (" (known fake/secondary profile in threat ledger)." if other_is_fake else "."),
                        "availability": "AVAILABLE"
                    })

                # Flag image perceptual reuse
                if max_img_sim >= 0.80 and max_img_other:
                    signals.append({
                        "signal_name": "Profile Image Reuse Across Multiple Handles",
                        "signal_category": "Profile & Identity",
                        "detected": True,
                        "weight": 30,
                        "value": f"Similarity: {int(max_img_sim*100)}% with '@{max_img_other}'",
                        "explanation": f"Avatar perceptual hash matches ({int(max_img_sim*100)}%) profile image of '@{max_img_other}'.",
                        "availability": "AVAILABLE"
                    })
            except Exception:
                pass

        # 11. Record compliance signal
        signals.append({
            "signal_name": "Private Scraping & Unauthorized Data Bypass",
            "signal_category": "Profile & Identity",
            "detected": False,
            "weight": 0,
            "value": "Restricted by platform Terms of Service",
            "explanation": "Phantix only analyzes authorized, public signals and does not bypass private profile restrictions.",
            "availability": "UNAVAILABLE"
        })

        return {
            "signals": signals,
            "metadata": metadata
        }

