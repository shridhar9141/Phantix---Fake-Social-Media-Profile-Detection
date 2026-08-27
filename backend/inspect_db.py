import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect

env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
inspector = inspect(engine)

print("Checking existing database schema...")
for table_name in inspector.get_table_names():
    print(f"\nTable: {table_name}")
    for col in inspector.get_columns(table_name):
        print(f"  - {col['name']}: {col['type']}")
