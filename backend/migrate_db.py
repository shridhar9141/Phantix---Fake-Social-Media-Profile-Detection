import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def run_migrations():
    print("Running safe database migrations...")
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;"))
        conn.execute(text("ALTER TABLE analysis_signals ALTER COLUMN investigation_id DROP NOT NULL;"))
        conn.commit()
        print("[SUCCESS] Applied safe schema updates to PostgreSQL phantix_db.")

if __name__ == "__main__":
    run_migrations()
