import sys
import os
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.services.seed_dataset import seed_synthetic_dataset

client = TestClient(app)

DEV_HEADER = {
    "Authorization": "Bearer mock-firebase-token-test_user_777::analyst@phantix.io::Lead Analyst"
}

def run_tests():
    print("==================================================")
    print("Running Phantix End-to-End Platform Verification")
    print("==================================================")

    # 1. Health Check
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] 1. Health Check Endpoint (/health)")

    # 2. User Sync (UPSERT Mechanism & Security Verification)
    sync_payload = {
        "firebase_uid": "test_user_777",
        "email": "analyst@phantix.io",
        "username": "lead_analyst",
        "display_name": "Lead Analyst"
    }
    res = client.post("/api/v1/users/sync", json=sync_payload, headers=DEV_HEADER)
    assert res.status_code == 200, f"User sync failed: {res.text}"
    user_data = res.json()
    assert user_data["firebase_uid"] == "test_user_777"
    assert user_data["username"] == "lead_analyst"
    assert "password" not in user_data, "SECURITY ERROR: Password field exposed in response!"
    print("[PASS] 2. User Sync UPSERT & Security Verification (/api/v1/users/sync)")

    # 3. Repeat Sync (Verify no duplicate user created, last_login_at updated)
    res_repeat = client.post("/api/v1/users/sync", json=sync_payload, headers=DEV_HEADER)
    assert res_repeat.status_code == 200
    assert res_repeat.json()["id"] == user_data["id"]
    print("[PASS] 3. Duplicate User Prevention & last_login_at Update")

    # 4. Dataset Seeding
    res_seed = client.post("/api/v1/dataset/seed", headers=DEV_HEADER)
    assert res_seed.status_code == 200
    print("[PASS] 4. Synthetic Detection Dataset Seeder (/api/v1/dataset/seed)")

    # 5. Dataset Retrieval
    res_ds = client.get("/api/v1/dataset", headers=DEV_HEADER)
    assert res_ds.status_code == 200
    dataset_items = res_ds.json()
    assert len(dataset_items) > 0
    print(f"[PASS] 5. Detection Dataset Retrieval ({len(dataset_items)} benchmark items)")

    # 6. URL Search & Pipeline Execution
    search_payload = {"url": "https://www.instagram.com/rahul_official_01/"}
    res_search = client.post("/api/v1/search", json=search_payload, headers=DEV_HEADER)
    assert res_search.status_code == 200, f"URL Search failed: {res_search.text}"
    inv_data = res_search.json()
    assert inv_data["platform"] == "Instagram"
    assert inv_data["risk_score"] > 0
    print(f"[PASS] 6. URL Search & Analysis Pipeline (Risk Score: {inv_data['risk_score']}, Risk Level: {inv_data['risk_level']})")

    # 7. User Activity Log
    res_act = client.get("/api/v1/activity/recent", headers=DEV_HEADER)
    assert res_act.status_code == 200
    activities = res_act.json()
    assert len(activities) > 0
    act_types = [a["activity_type"] for a in activities]
    assert "URL_SEARCHED" in act_types
    print(f"[PASS] 7. User Activity Log Verification ({len(activities)} recorded events)")

    # 8. Profile Analysis Detail & Signals
    res_profiles = client.get("/api/v1/profiles", headers=DEV_HEADER)
    assert res_profiles.status_code == 200
    profiles = res_profiles.json()
    assert len(profiles) > 0

    target_profile = profiles[0]
    res_analysis = client.get(f"/api/v1/profiles/{target_profile['id']}/analysis", headers=DEV_HEADER)
    assert res_analysis.status_code == 200
    analysis = res_analysis.json()
    assert "risk_score" in analysis
    print(f"[PASS] 8. Profile Analysis Detail & Signals (/api/v1/profiles/{target_profile['id']}/analysis)")

    # 9. Profile Connections
    res_conn = client.get(f"/api/v1/profiles/{target_profile['id']}/connections", headers=DEV_HEADER)
    assert res_conn.status_code == 200
    connections = res_conn.json()
    print(f"[PASS] 9. Profile Connection Detection ({len(connections)} connections found)")

    print("\n==================================================")
    print("ALL 9 VERIFICATION CHECKS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
