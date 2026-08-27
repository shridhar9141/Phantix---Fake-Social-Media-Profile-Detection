import os
import sys
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

from app.core.database import engine, Base
import app.models # Register all models

def run_migration():
    print("[MIGRATION] Creating investigation_reports, complaints, and complaint_evidence tables if not exists...")
    Base.metadata.create_all(bind=engine)
    print("[MIGRATION SUCCESS] Reports & Complaints database tables created successfully!")

if __name__ == "__main__":
    run_migration()
