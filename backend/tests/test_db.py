import os
import sys

# Ensure backend directory is in python search path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database.session import SessionLocal, engine
from backend.database.base import Base
from backend.models.user import User
from backend.models.investor import Investor
from backend.models.meeting import Meeting
from backend.models.memory import Memory
from backend.models.recommendation import Recommendation
from backend.models.followup import FollowUp

def test_connection():
    print("Testing Supabase PostgreSQL Connection...")
    try:
        # Create database tables if they do not exist yet
        print("Ensuring database tables are created on Supabase...")
        Base.metadata.create_all(bind=engine)
        
        db = SessionLocal()
        # Query count of users
        user_count = db.query(User).count()
        print(f"Connection Successful! Total users in database: {user_count}")
        db.close()
    except Exception as e:
        print("Error connecting to Supabase database:", e)

if __name__ == "__main__":
    test_connection()
