import re
from difflib import SequenceMatcher
from typing import Dict, Any, List, Tuple, Optional
from sqlalchemy.orm import Session

try:
    from rapidfuzz import fuzz
    HAS_RAPIDFUZZ = True
except ImportError:
    HAS_RAPIDFUZZ = False

from app.models.profile import Profile
from app.models.profile_analysis import ProfileAnalysis
from app.models.signal import AnalysisSignal
from app.models.evidence import Evidence
from app.models.profile_feature import ProfileFeature
from app.models.profile_connection import ProfileConnection
from app.analyzers.image_similarity import compute_dhash_from_bytes, calculate_image_similarity_percentage, fetch_and_hash_image

def calculate_string_similarity(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    if HAS_RAPIDFUZZ:
        return round(fuzz.ratio(a.lower().strip(), b.lower().strip()) / 100.0, 2)
    return round(SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio(), 2)

def analyze_social_profile(db: Session, profile: Profile) -> ProfileAnalysis:
    """
    Executes real profile detection analysis pipeline.
    Calculates deterministic weighted risk score (0-100), risk level,
    generates analysis signals, evidence records, profile features, and profile connections.
    Includes username fuzzy matching, bio similarity, and image perceptual hash comparison.
    """
    signals: List[Dict[str, Any]] = []
    evidence_items: List[Dict[str, Any]] = []
    total_score = 0

    # Feature metrics
    username = profile.username or ""
    display_name = profile.display_name or ""
    followers = profile.followers_count
    following = profile.following_count
    posts = profile.posts_count
    bio = profile.bio or ""
    website = profile.website_url or ""
    image_url = profile.profile_image_url or ""

    # Ensure profile.raw_data dict exists
    if not isinstance(profile.raw_data, dict):
        profile.raw_data = {}

    # 1. Fake / Spam Indicators in Display Name
    dn_lower = (display_name or "").lower().strip()
    fake_dn_keywords = [
        "fake account", "fake profile", "fake id", "fake", "spam account", "spam", "backup account", 
        "backup", "burner", "troll", "bot", "temp account", "2nd account", "imposter", 
        "parody", "fanpage", "anon", "anonymous", "hacked", "giveaway", "dm for promo", "dump account", "stalker"
    ]
    matched_dn = [kw for kw in fake_dn_keywords if kw in dn_lower]
    if matched_dn:
        weight = 50
        total_score += weight
        signals.append({
            "name": "Fake Account Indicator in Display Name",
            "category": "Profile & Identity",
            "detected": True,
            "weight": weight,
            "value": f"Matched in Display Name: '{', '.join(matched_dn)}'",
            "explanation": f"Profile display name '{display_name}' explicitly contains fake account / spam / burner indicator keywords ({', '.join(matched_dn)})."
        })
        evidence_items.append({
            "type": "FAKE_DISPLAY_NAME",
            "description": f"Display name explicitly indicates a fake, spam, or burner account pattern: '{display_name}'.",
            "confidence": 0.98,
            "severity": "CRITICAL"
        })
    else:
        signals.append({
            "name": "Fake Account Indicator in Display Name",
            "category": "Profile & Identity",
            "detected": False,
            "weight": 0,
            "value": "Clean display name",
            "explanation": "No suspicious fake account keywords detected in display name."
        })

    # 2. Fake / Solicitation Keywords in Bio
    bio_lower = (bio or "").lower().strip()
    fake_bio_keywords = [
        "fake account", "fake profile", "fake id", "fake", "backup account", "spam account", "burner", 
        "dm for promo", "dm for collabs", "sugar daddy", "sugar baby", "cashapp", "telegram", 
        "whatsapp me", "drop your pin", "free followers", "crypto", "forex", "dating", "onlyfans", "cash app"
    ]
    matched_bio = [kw for kw in fake_bio_keywords if kw in bio_lower]
    if matched_bio:
        weight = 35
        total_score += weight
        signals.append({
            "name": "Suspicious / Fake Profile Keywords in Bio",
            "category": "Content & Page",
            "detected": True,
            "weight": weight,
            "value": f"Bio keywords matched: '{', '.join(matched_bio)}'",
            "explanation": f"Profile bio contains suspicious solicitation, spam, or fake account keywords ({', '.join(matched_bio)})."
        })
        evidence_items.append({
            "type": "SUSPICIOUS_BIO",
            "description": f"Bio contains high-risk solicitation or fake account indicator: '{', '.join(matched_bio)}'.",
            "confidence": 0.90,
            "severity": "HIGH"
        })
    else:
        signals.append({
            "name": "Suspicious / Fake Profile Keywords in Bio",
            "category": "Content & Page",
            "detected": False,
            "weight": 0,
            "value": "No fake bio keywords",
            "explanation": "Profile bio does not contain obvious fake account or spam solicitation patterns."
        })

    # 3. Bio Syntax & Repetitive Formatting Anomaly
    if bio and re.search(r"[_\-\*~=]{4,}", bio):
        weight = 15
        total_score += weight
        signals.append({
            "name": "Bio Formatting & Syntax Anomaly",
            "category": "Content & Page",
            "detected": True,
            "weight": weight,
            "value": "Repetitive symbol dividers detected in bio",
            "explanation": "Profile bio uses abnormal repetitive divider formatting commonly seen in spam and burner profiles."
        })

    # 4. Username Pattern Anomaly (Impersonation check)
    username_impersonation = False
    impersonation_keywords = ["official", "support", "help", "real", "customer_service", "verify", "security", "recovery", "admin"]
    found_keywords = [kw for kw in impersonation_keywords if kw in username.lower()]
    
    if found_keywords:
        username_impersonation = True
        weight = 30
        total_score += weight
        signals.append({
            "name": "Support / Official Impersonation Keywords",
            "category": "Profile & Identity",
            "detected": True,
            "weight": weight,
            "value": f"Contains impersonation keywords: {', '.join(found_keywords)}",
            "explanation": f"Username '{username}' contains brand/authority keywords ({', '.join(found_keywords)}) common in imposter accounts."
        })
        evidence_items.append({
            "type": "SIMILAR_USERNAME",
            "description": f"Username pattern suggests potential brand impersonation using keywords: {', '.join(found_keywords)}.",
            "confidence": 0.85,
            "severity": "HIGH"
        })
    else:
        signals.append({
            "name": "Support / Official Impersonation Keywords",
            "category": "Profile & Identity",
            "detected": False,
            "weight": 0,
            "value": "Normal username structure",
            "explanation": "No suspicious impersonation keywords found in username."
        })

    # 5. Audience Pattern Anomaly (Followers / Following Ratio)
    ratio_score = 0.0
    if followers is not None and following is not None:
        ratio = following / max(followers, 1)
        if ratio >= 3.0 and followers < 150:
            weight = 35
            total_score += weight
            ratio_score = 0.95
            signals.append({
                "name": "Burner / Throwaway Following Disproportion",
                "category": "Audience & Engagement",
                "detected": True,
                "weight": weight,
                "value": f"Following: {following:,} | Followers: {followers:,} (Ratio: {ratio:.1f}x)",
                "explanation": f"Burner Profile Pattern: Account follows {following:,} users (nearly {ratio:.1f}x its audience of {followers:,} followers), a classic signature of throwaway or scraper burner accounts."
            })
            evidence_items.append({
                "type": "ABNORMAL_FOLLOW_RATIO",
                "description": f"Burner following ratio: Following {following:,} users with {followers:,} followers (Ratio: {ratio:.1f}x).",
                "confidence": 0.95,
                "severity": "HIGH"
            })
        elif following > 1000 and ratio > 1.8:
            weight = 30
            total_score += weight
            ratio_score = 0.85
            signals.append({
                "name": "Audience Pattern Anomaly (Mass Following)",
                "category": "Audience & Engagement",
                "detected": True,
                "weight": weight,
                "value": f"Following: {following:,} | Followers: {followers:,} (Ratio: {ratio:.1f})",
                "explanation": f"Mass-Following Anomaly: Account follows {following:,} users (more than {ratio:.1f}x its audience), characteristic of automated follow-unfollow bot activity."
            })
            evidence_items.append({
                "type": "ABNORMAL_FOLLOW_RATIO",
                "description": f"Mass follow ratio anomaly: Following {following:,} users with {followers:,} followers (Ratio: {ratio:.1f}).",
                "confidence": 0.90,
                "severity": "HIGH"
            })
        elif following > 500 and followers < 50:
            weight = 35
            total_score += weight
            ratio_score = 0.95
            signals.append({
                "name": "Audience Pattern Anomaly (Mass Following)",
                "category": "Audience & Engagement",
                "detected": True,
                "weight": weight,
                "value": f"Following {following} users with only {followers} followers (Ratio: {ratio:.1f})",
                "explanation": "Severe Audience Disproportion: Account follows hundreds of users with virtually no follower base."
            })
            evidence_items.append({
                "type": "ABNORMAL_FOLLOW_RATIO",
                "description": f"Abnormal follow ratio: Account follows {following} users but has only {followers} followers.",
                "confidence": 0.95,
                "severity": "HIGH"
            })
        elif ratio > 2.5 and following > 150:
            weight = 25
            total_score += weight
            ratio_score = 0.7
            signals.append({
                "name": "Audience Pattern Anomaly (Mass Following)",
                "category": "Audience & Engagement",
                "detected": True,
                "weight": weight,
                "value": f"Ratio: {ratio:.1f}",
                "explanation": "Audience Pattern: Elevated follow ratio relative to audience size."
            })
    else:
        signals.append({
            "name": "Audience Pattern Anomaly (Mass Following)",
            "category": "Audience & Engagement",
            "detected": False,
            "weight": 0,
            "value": "Metrics unavailable through data source",
            "explanation": "Audience metrics unavailable from platform integration."
        })

    # 6. Low Post Activity & Throwaway Signature
    activity_score = 0.0
    if posts is not None and posts <= 5 and (followers is None or followers < 100) and (following is not None and followers is not None and (following / max(followers, 1)) > 2.0):
        weight = 25
        total_score += weight
        activity_score = 0.85
        signals.append({
            "name": "Low Organic Activity & Throwaway Signature",
            "category": "Content & Page",
            "detected": True,
            "weight": weight,
            "value": f"Total posts: {posts} | Followers: {followers} | Following: {following}",
            "explanation": f"Throwaway Profile Signature: Account has only {posts} post(s) with minimal followers ({followers}) but follows {following} users."
        })
    elif posts is not None and posts < 3 and (followers is None or followers < 50):
        weight = 15
        total_score += weight
        activity_score = 0.75
        signals.append({
            "name": "Low Organic Activity & Throwaway Signature",
            "category": "Content & Page",
            "detected": True,
            "weight": weight,
            "value": f"Total posts: {posts}",
            "explanation": "Extremely low publication activity. Fake accounts frequently have few to no original posts."
        })

    # 7. Bio & External Link Risk
    suspicious_link_score = 0.0
    url_pattern = re.compile(r'https?://[^\s]+')
    found_urls = url_pattern.findall(bio + " " + website)
    if found_urls:
        suspicious_domains = ["bit.ly", "tinyurl.com", "t.co", "ngrok.io", "xyz", "top", "gq", "click", "linktr.ee"]
        if any(sd in url.lower() for url in found_urls for sd in suspicious_domains):
            weight = 25
            total_score += weight
            suspicious_link_score = 0.9
            signals.append({
                "name": "Suspicious External Link in Bio",
                "category": "Reputation & External",
                "detected": True,
                "weight": weight,
                "value": f"Link: {found_urls[0]}",
                "explanation": "Profile bio contains a shortened or high-risk TLD redirection link."
            })
            evidence_items.append({
                "type": "SUSPICIOUS_URL",
                "description": f"Profile bio promotes redirection or high-risk domain link: {found_urls[0]}",
                "confidence": 0.92,
                "severity": "HIGH"
            })

    # 8. Profile Completeness
    completeness = 0
    if profile.profile_image_url: completeness += 25
    if bio and bio != "No public bio provided.": completeness += 25
    if posts is not None and posts > 0: completeness += 25
    if profile.display_name: completeness += 25
    completeness_score = (100 - completeness) / 100.0

    # 9. Database Historical Similarity Check (Username, Bio, Profile Image Perceptual Hashing)
    existing_profiles = db.query(Profile).filter(Profile.id != profile.id).all()
    img_hash_current = profile.raw_data.get("image_hash")

    matched_image_similarity = 0.0
    matched_image_other_username = None
    max_user_sim = 0.0
    max_user_other = None

    for other in existing_profiles:
        # Username similarity comparison
        sim_username = calculate_string_similarity(username, other.username)
        sim_bio = calculate_string_similarity(bio, other.bio) if bio and other.bio else 0.0
        
        if sim_username > max_user_sim:
            max_user_sim = sim_username
            max_user_other = other

        # Image perceptual hash comparison
        sim_image = 0.0
        other_raw = other.raw_data if isinstance(other.raw_data, dict) else {}
        other_img_hash = other_raw.get("image_hash")

        if img_hash_current and other_img_hash:
            sim_image = calculate_image_similarity_percentage(img_hash_current, other_img_hash)
        elif image_url and image_url == other.profile_image_url:
            sim_image = 1.0

        if sim_image > matched_image_similarity:
            matched_image_similarity = sim_image
            matched_image_other_username = other.username

        conn_type = None
        exp = None
        score = 0.0

        if sim_image >= 0.80:
            conn_type = "PROFILE_IMAGE_SIMILARITY"
            exp = f"Profile image shows {int(sim_image*100)}% perceptual similarity with investigated profile '@{other.username}'."
            score = sim_image
        elif sim_username >= 0.82:
            conn_type = "SIMILAR_USERNAME"
            exp = f"High username similarity ({int(sim_username*100)}%) between '@{username}' and '@{other.username}'."
            score = sim_username
        elif sim_bio >= 0.85:
            conn_type = "SIMILAR_BIO"
            exp = f"Near-identical bio text detected between '@{username}' and '@{other.username}'."
            score = sim_bio

        if conn_type:
            existing_conn = db.query(ProfileConnection).filter(
                ((ProfileConnection.profile_id_1 == profile.id) & (ProfileConnection.profile_id_2 == other.id)) |
                ((ProfileConnection.profile_id_1 == other.id) & (ProfileConnection.profile_id_2 == profile.id))
            ).first()
            if not existing_conn:
                db.add(ProfileConnection(
                    profile_id_1=profile.id,
                    profile_id_2=other.id,
                    connection_type=conn_type,
                    explanation=exp,
                    similarity_score=score
                ))

    # Add Signal for Cross-Profile Clone / Impersonator
    if max_user_sim >= 0.85 and max_user_other:
        other_is_fake = False
        other_dn = (max_user_other.display_name or "").lower()
        if any(kw in other_dn for kw in fake_dn_keywords) or (max_user_other.username and any(kw in max_user_other.username.lower() for kw in ["fake", "spam", "burner", "bot"])):
            other_is_fake = True

        weight = 35
        total_score += weight
        signals.append({
            "name": "Cross-Profile Clone / Impersonation Signature",
            "category": "Profile & Identity",
            "detected": True,
            "weight": weight,
            "value": f"Similarity: {int(max_user_sim*100)}% with '@{max_user_other.username}'",
            "explanation": f"High handle similarity ({int(max_user_sim*100)}%) with entity '@{max_user_other.username}'" + (" (known fake/secondary profile in threat ledger)." if other_is_fake else "."),
            "availability": "AVAILABLE"
        })
        evidence_items.append({
            "type": "IMPERSONATION_CLONE",
            "description": f"High handle similarity with entity '@{max_user_other.username}' ({int(max_user_sim*100)}%).",
            "confidence": max_user_sim,
            "severity": "HIGH"
        })

    # Add Signal for Image Similarity if detected against historical records
    if matched_image_similarity >= 0.80 and matched_image_other_username:
        weight = 30
        total_score += weight
        signals.append({
            "name": "Profile Image Reuse Across Multiple Handles",
            "category": "Profile & Identity",
            "detected": True,
            "weight": weight,
            "value": f"Similarity: {int(matched_image_similarity*100)}% with '@{matched_image_other_username}'",
            "explanation": f"Profile image is highly similar ({int(matched_image_similarity*100)}%) to an image associated with investigated profile '@{matched_image_other_username}'.",
            "availability": "AVAILABLE"
        })
        evidence_items.append({
            "type": "IMAGE_REUSE",
            "description": f"Profile avatar perceptual hash matches '@{matched_image_other_username}' ({int(matched_image_similarity*100)}%).",
            "confidence": matched_image_similarity,
            "severity": "HIGH"
        })
    else:
        signals.append({
            "name": "Profile Image Reuse Across Multiple Handles",
            "category": "Profile & Identity",
            "detected": False,
            "weight": 0,
            "value": "No duplicate avatar match in DB",
            "explanation": "Profile image does not match previously recorded target profile images.",
            "availability": "AVAILABLE" if image_url else "UNAVAILABLE"
        })

    # Final Risk Level Determination
    final_score = min(total_score, 100)
    fake_prob = round(final_score / 100.0, 2)

    if final_score >= 80:
        risk_level = "CRITICAL"
    elif final_score >= 60:
        risk_level = "HIGH"
    elif final_score >= 30:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # Save Profile Features
    feature_record = db.query(ProfileFeature).filter(ProfileFeature.profile_id == profile.id).first()
    if not feature_record:
        feature_record = ProfileFeature(
            profile_id=profile.id,
            investigation_id=profile.investigation_id
        )
        db.add(feature_record)
    
    feature_record.username_similarity_score = 0.85 if username_impersonation else 0.0
    feature_record.follower_following_ratio = ratio_score
    feature_record.account_age_score = 0.0
    feature_record.activity_score = activity_score
    feature_record.profile_completeness_score = completeness_score
    feature_record.suspicious_link_score = suspicious_link_score

    # Save or update Profile Analysis
    analysis = db.query(ProfileAnalysis).filter(ProfileAnalysis.profile_id == profile.id).first()
    if not analysis:
        analysis = ProfileAnalysis(profile_id=profile.id)
        db.add(analysis)
    
    analysis.risk_score = final_score
    analysis.risk_level = risk_level
    analysis.fake_probability = fake_prob
    analysis.analysis_data = {
        "summary_explanation": f"Profile evaluated with risk score {final_score}/100 ({risk_level}). Assessment is calculated from public signals and similarity heuristics.",
        "signals_detected_count": len([s for s in signals if s.get("detected")]),
        "total_signals_evaluated": len(signals),
        "signals": signals
    }

    # Clear old signals & evidence for recalculation
    db.query(AnalysisSignal).filter(AnalysisSignal.profile_id == profile.id).delete()
    db.query(Evidence).filter(Evidence.profile_id == profile.id).delete()
    db.flush()

    # Save Signals
    for sig in signals:
        db.add(AnalysisSignal(
            investigation_id=profile.investigation_id,
            profile_id=profile.id,
            signal_name=sig["name"],
            signal_category=sig["category"],
            detected=sig.get("detected", False),
            weight=sig["weight"],
            value=sig.get("value"),
            explanation=sig["explanation"],
            availability=sig.get("availability", "AVAILABLE")
        ))

    # Save Evidence
    for ev in evidence_items:
        db.add(Evidence(
            profile_id=profile.id,
            evidence_type=ev["type"],
            description=ev["description"],
            confidence=ev["confidence"],
            severity=ev["severity"]
        ))

    db.commit()
    db.refresh(analysis)
    return analysis
