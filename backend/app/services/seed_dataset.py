import logging
from sqlalchemy.orm import Session
from app.models.detection_dataset import DetectionDataset
from app.models.profile import Profile
from app.services.profile_analysis_service import analyze_social_profile

logger = logging.getLogger("identitytrace.seeder")

SYNTHETIC_DATASET = [
    {
        "platform": "Instagram",
        "username": "tech_rahul",
        "display_name": "Rahul Sharma",
        "bio": "Senior Cyber Security Researcher & Software Engineer. Sharing AI & Infosec insights.",
        "followers_count": 4850,
        "following_count": 310,
        "posts_count": 142,
        "account_age_days": 1250,
        "is_verified": True,
        "is_private": False,
        "profile_image_reference": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        "profile_url": "https://instagram.com/tech_rahul",
        "label": "LEGITIMATE",
        "label_source": "Verified Team Benchmark",
        "dataset_source": "Phantix Hackathon Synthetic Pool",
        "notes": "Authentic researcher profile with active posts and organic engagement."
    },
    {
        "platform": "Instagram",
        "username": "rahul_official_01",
        "display_name": "Rahul Sharma Official",
        "bio": "Official Backup Page of Rahul Sharma! DM for business queries & crypto investments.",
        "followers_count": 32,
        "following_count": 890,
        "posts_count": 1,
        "account_age_days": 4,
        "is_verified": False,
        "is_private": False,
        "profile_image_reference": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        "profile_url": "https://instagram.com/rahul_official_01",
        "label": "SUSPICIOUS",
        "label_source": "Automated Anomaly Detection",
        "dataset_source": "Phantix Hackathon Synthetic Pool",
        "notes": "Suspicious follow ratio, copied profile picture from tech_rahul, created 4 days ago."
    },
    {
        "platform": "Instagram",
        "username": "rahul.official.support",
        "display_name": "Rahul Support & Helpdesk",
        "bio": "Customer support desk for tech_rahul account recovery. Click here: bit.ly/recover_pass",
        "followers_count": 5,
        "following_count": 1200,
        "posts_count": 0,
        "account_age_days": 2,
        "is_verified": False,
        "is_private": False,
        "profile_image_reference": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        "profile_url": "https://instagram.com/rahul.official.support",
        "label": "FAKE",
        "label_source": "Impersonation Analysis",
        "dataset_source": "Phantix Hackathon Synthetic Pool",
        "notes": "Fake imposter support account with phishing URL redirect."
    },
    {
        "platform": "Instagram",
        "username": "fitness_maya",
        "display_name": "Maya Patel Fitness",
        "bio": "Certified Personal Trainer & Nutritionist. Daily workouts & healthy living recipes.",
        "followers_count": 12400,
        "following_count": 420,
        "posts_count": 380,
        "account_age_days": 980,
        "is_verified": False,
        "is_private": False,
        "profile_image_reference": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        "profile_url": "https://instagram.com/fitness_maya",
        "label": "LEGITIMATE",
        "label_source": "Verified Team Benchmark",
        "dataset_source": "Phantix Hackathon Synthetic Pool",
        "notes": "Legitimate fitness creator with established long-term activity."
    },
    {
        "platform": "Instagram",
        "username": "maya_fit_real",
        "display_name": "Maya Patel Real Fit",
        "bio": "New account for fitness_maya! Follow for daily giveaways.",
        "followers_count": 12,
        "following_count": 650,
        "posts_count": 2,
        "account_age_days": 7,
        "is_verified": False,
        "is_private": False,
        "profile_image_reference": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        "profile_url": "https://instagram.com/maya_fit_real",
        "label": "SUSPICIOUS",
        "label_source": "Impersonation Analysis",
        "dataset_source": "Phantix Hackathon Synthetic Pool",
        "notes": "Suspicious clone profile targeting fitness_maya."
    }
]

def seed_synthetic_dataset(db: Session):
    """
    Populates detection_dataset and creates evaluated profiles for demonstration.
    """
    logger.info("Seeding synthetic profile detection dataset...")
    count_seeded = 0

    for item in SYNTHETIC_DATASET:
        existing = db.query(DetectionDataset).filter(DetectionDataset.username == item["username"]).first()
        if not existing:
            dataset_entry = DetectionDataset(
                platform=item["platform"],
                username=item["username"],
                display_name=item["display_name"],
                bio=item["bio"],
                followers_count=item["followers_count"],
                following_count=item["following_count"],
                posts_count=item["posts_count"],
                account_age_days=item["account_age_days"],
                is_verified=item["is_verified"],
                is_private=item["is_private"],
                profile_image_reference=item["profile_image_reference"],
                profile_url=item["profile_url"],
                label=item["label"],
                label_source=item["label_source"],
                dataset_source=item["dataset_source"],
                notes=item["notes"]
            )
            db.add(dataset_entry)

        # Also populate profiles table so detection engine can analyze connections
        profile = db.query(Profile).filter(Profile.username == item["username"]).first()
        if not profile:
            profile = Profile(
                platform=item["platform"],
                username=item["username"],
                display_name=item["display_name"],
                bio=item["bio"],
                followers_count=item["followers_count"],
                following_count=item["following_count"],
                posts_count=item["posts_count"],
                account_age_days=item["account_age_days"],
                is_verified=item["is_verified"],
                is_private=item["is_private"],
                profile_image_url=item["profile_image_reference"],
                profile_url=item["profile_url"]
            )
            db.add(profile)
            db.flush()
            analyze_social_profile(db, profile)
            count_seeded += 1

    db.commit()
    logger.info(f"Successfully seeded {count_seeded} synthetic profiles.")
    return count_seeded
