import os
import sys

# Ensure backend directory is in python search path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database.session import SessionLocal
from backend.database.base import Base
from backend.database.session import engine
from backend.models import User, Investor, Meeting, Memory, Recommendation, FollowUp
from backend.services.auth_service import AuthService
from backend.graphs.founder_graph import get_graph
from backend.tools.qdrant_tool import QdrantTool

def test_full_flow():
    print("Testing Full LangGraph Orchestration Flow...")
    # Initialize SQL DB Schema
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # 1. Seed user if not exists
        user_email = "testfounder@example.com"
        test_user = db.query(User).filter(User.email == user_email).first()
        if not test_user:
            hashed_pwd = AuthService.get_password_hash("securepass123")
            test_user = User(full_name="Test Founder", email=user_email, hashed_password=hashed_pwd)
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            print(f"Seeded test user: {test_user.email}")
            
        # 2. Recreate test investor to ensure correct field types (preferences dict)
        investor_name = "XL Ventures"
        db.query(Investor).filter(
            Investor.name == investor_name,
            Investor.owner_id == test_user.id
        ).delete()
        db.commit()

        test_investor = Investor(
            id="p100",
            owner_id=test_user.id,
            name=investor_name,
            firm="XL Ventures",
            role="Managing Partner",
            status="Active Diligence",
            last_contact="Yesterday",
            location="Silicon Valley",
            typical_check="₹2.5Cr - ₹10Cr",
            focus=["AI", "SaaS", "Enterprise"],
            stage="Seed",
            preferences={"min_check_size": 250000, "max_check_size": 1000000}
        )
        db.add(test_investor)
        db.commit()
        db.refresh(test_investor)
        print(f"Seeded test investor: {test_investor.name}")


        # 3. Setup Qdrant
        qdrant = QdrantTool()
        qdrant.ensure_collections()

        # 4. Execute LangGraph Pipeline
        graph = get_graph()
        initial_state = {
            "query": "I met XL Ventures yesterday to show them our new AI product deck.",
            "owner_id": test_user.id,
            "db": db,
            "qdrant": qdrant,
            "current_index": 0,
            "workflow": [],
            "collections": [],
            "extracted_data": {},
            "extracted_meeting_data": {},
            "recommendation_data": {},
            "memories": [],
            "notes": [],
            "transcripts": [],
            "scores": {},
            "recommendations": [],
            "explanation": "",
            "communication": {},
            "communication_type": "Follow-up Email",
            "communication_tone": "Professional"
        }
        
        print("Invoking graph...")
        result = graph.invoke(initial_state)
        
        print("\n=== Graph Execution Completed ===")
        print(f"Result keys: {list(result.keys())}")
        print(f"Result: {result}")
        print("=================================\n")
        
        print("LangGraph Orchestrator Integration Test passed.")
    except Exception as e:
        print("Integration Test Failed:", e)
    finally:
        db.close()

if __name__ == "__main__":
    test_full_flow()
