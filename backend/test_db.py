import sys
import os
from dotenv import load_dotenv
from sqlalchemy import text

# Load backend/.env
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

from app.core.database import engine, Base
import app.models  # Register models

def test_connection():
    print("==========================================")
    print("Testing PostgreSQL Database Connection...")
    print("==========================================")
    
    db_url = os.getenv("DATABASE_URL", "")
    masked_url = db_url
    if "@" in db_url:
        prefix, rest = db_url.split("@", 1)
        if ":" in prefix:
            scheme_user = prefix.rsplit(":", 1)[0]
            masked_url = f"{scheme_user}:****@{rest}"
    
    print(f"Connecting to: {masked_url}")

    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version();"))
            pg_version = result.fetchone()[0]
            print("\n[SUCCESS] PostgreSQL Connection Successful!")
            print(f"PostgreSQL Version: {pg_version}")

            # Test table creation
            print("\nInitialising ORM Database Tables...")
            Base.metadata.create_all(bind=engine)
            print("[SUCCESS] All SQLAlchemy ORM tables created/verified successfully!")

    except Exception as err:
        print("\n[ERROR] PostgreSQL Connection Failed!")
        print(f"Error Details: {err}")
        print("\nTroubleshooting Tips:")
        print("1. Ensure local PostgreSQL server is running on localhost:5432.")
        print("2. Ensure database 'phantix_db' exists in PostgreSQL (run: CREATE DATABASE phantix_db;).")
        print("3. Check credentials in backend/.env.")
        sys.exit(1)

if __name__ == "__main__":
    test_connection()
