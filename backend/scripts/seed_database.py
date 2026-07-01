import os
import sys

# Ensure backend directory is in python search path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database.base import Base
from backend.database.session import engine, SessionLocal
from backend.tools.qdrant_tool import QdrantTool
from backend.services.auth_service import AuthService
from backend.app.db import User, StartupProfile, Investor, Memory, Meeting, FollowUp, Recommendation, ActivityLog

def seed():
    print("Initializing Database tables...")
    Base.metadata.create_all(bind=engine)

    print("Verifying Qdrant Vector collections...")
    try:
        qdrant = QdrantTool()
        qdrant.ensure_collections()
        print("[OK] Qdrant collections verified.")
    except Exception as e:
        print(f"Warning: Qdrant setup failed: {e}")

    print("Starting database seeding...")
    db = SessionLocal()
    try:
        # Check user
        akshatha_user = db.query(User).filter(User.email == "akshatha@gmail.com").first()
        if not akshatha_user:
            hashed_pwd = AuthService.get_password_hash("akshatha")
            akshatha_user = User(
                full_name="akshatha",
                email="akshatha@gmail.com",
                hashed_password=hashed_pwd,
                role="Founder"
            )
            db.add(akshatha_user)
            db.commit()
            db.refresh(akshatha_user)
            print("Seeded user 'akshatha@gmail.com'.")

        # Check startup profile for akshatha
        profile = db.query(StartupProfile).filter(StartupProfile.owner_id == akshatha_user.id).first()
        if not profile:
            profile = StartupProfile(
                owner_id=akshatha_user.id,
                industry="AI, SaaS, Data Engineering",
                stage="Seed",
                amount_raising=1000000.0,
                team_size=5,
                arr=120000.0,
                description="",
                has_deck=True,
                has_financial_model=True,
                has_cap_table=True,
                has_one_pager=False,
                has_legal_setup=True
            )
            db.add(profile)
            db.commit()
            print("Seeded startup profile for 'akshatha@gmail.com'.")

        # Check/Seed investors
        investors_data = [
            ("sravya", "Alpha Capital", "San Francisco", "$250K - $500K", ["AI", "SaaS"], "Pipeline Lead", 85),
            ("deepthi", "Beta Ventures", "New York", "$500K - $1.0M", ["SaaS", "Data Engineering"], "Pipeline Lead", 75),
            ("anushka", "Gamma Seed", "London", "$100K - $250K", ["AI"], "Pipeline Lead", 90)
        ]
        
        seeded_investors = {}
        for name, firm, location, check, focus, status, score in investors_data:
            inv = db.query(Investor).filter(Investor.name == name, Investor.owner_id == akshatha_user.id).first()
            if not inv:
                inv = Investor(
                    owner_id=akshatha_user.id,
                    name=name,
                    firm=firm,
                    role="Partner",
                    status=status,
                    location=location,
                    typical_check=check,
                    focus=focus,
                    stage="Seed",
                    preferences={"min_check_size": 100000, "max_check_size": 1000000},
                    notes=f"Contact person at {firm}.",
                    interest_score=score
                )
                db.add(inv)
                db.commit()
                db.refresh(inv)
                print(f"Seeded investor '{name}'.")
            seeded_investors[name] = inv

        # Check/Seed relationship memories
        memories_data = [
            ("sravya", "Sravya discussed details about data pipeline architecture, specifically around database connectors.", "relationship_note"),
            ("deepthi", "Deepthi is keen on data pipelines and real-time streaming ingestion.", "relationship_note"),
            ("anushka", "Anushka is looking for deep integration with modern AI agent patterns.", "relationship_note")
        ]
        for inv_name, memory_text, m_type in memories_data:
            inv = seeded_investors[inv_name]
            mem = db.query(Memory).filter(Memory.investor_id == inv.id, Memory.memory == memory_text).first()
            if not mem:
                mem = Memory(
                    investor_id=inv.id,
                    owner_id=akshatha_user.id,
                    memory=memory_text,
                    memory_type=m_type
                )
                db.add(mem)
                db.commit()
                print(f"Seeded memory for '{inv_name}'.")

        # Check/Seed meetings
        meetings_data = [
            ("sravya", "Discussed pipeline scalability and developer onboarding", "30 mins", "Highly Engaged", "High", 85, ["Send SAFE draft", "Provide database security whitepaper"]),
            ("deepthi", "Explored transaction routing and stream processors", "30 mins", "Neutral", "Medium", 75, ["Follow up on check size alignment"]),
            ("anushka", "Dived deep into memory storage schemas and ChromaDB settings", "30 mins", "Highly Engaged", "High", 90, ["Provide testimonials", "Send SAFE terms"])
        ]
        seeded_meetings = {}
        for inv_name, summary, duration, sentiment, interest, score, next_steps in meetings_data:
            inv = seeded_investors[inv_name]
            meet = db.query(Meeting).filter(Meeting.investor_id == inv.id, Meeting.summary == summary).first()
            if not meet:
                meet = Meeting(
                    investor_id=inv.id,
                    owner_id=akshatha_user.id,
                    date="2026-06-29",
                    duration=duration,
                    summary=summary,
                    transcript="Raw discussion summary details regarding pipeline architectures.",
                    sentiment=sentiment,
                    interest_level=interest,
                    interest_score=score,
                    concerns=[],
                    questions=[],
                    next_steps=next_steps,
                    action_items=[{"task": t, "status": "pending"} for t in next_steps]
                )
                db.add(meet)
                db.commit()
                db.refresh(meet)
                print(f"Seeded meeting for '{inv_name}'.")
            seeded_meetings[inv_name] = meet

        # Check/Seed pending followups (exactly 2)
        followups_to_seed = [
            ("sravya", "Hi Sravya, great speaking with you about data pipelines. Attached are our notes..."),
            ("anushka", "Hi Anushka, following up on our deep-dive meeting regarding ChromaDB...")
        ]
        for inv_name, email_body in followups_to_seed:
            meet = seeded_meetings[inv_name]
            fup = db.query(FollowUp).filter(FollowUp.meeting_id == meet.id).first()
            if not fup:
                fup = FollowUp(
                    meeting_id=meet.id,
                    owner_id=akshatha_user.id,
                    email=email_body,
                    status="pending"
                )
                db.add(fup)
                db.commit()
                print(f"Seeded pending followup for '{inv_name}'.")

        # Check/Seed recommendations
        recommendations_data = [
            ("sravya", "Send SAFE draft", "High", "Investor requested terms during pipeline sync.", "2026-07-02"),
            ("anushka", "Provide testimonials", "High", "Demonstrating customer adoption is key.", "2026-07-03")
        ]
        for inv_name, action, priority, reason, deadline in recommendations_data:
            inv = seeded_investors[inv_name]
            rec = db.query(Recommendation).filter(Recommendation.investor_id == inv.id, Recommendation.action == action).first()
            if not rec:
                rec = Recommendation(
                    investor_id=inv.id,
                    owner_id=akshatha_user.id,
                    action=action,
                    next_best_actions=[action],
                    priority=priority,
                    reason=reason,
                    status="pending",
                    deadline=deadline
                )
                db.add(rec)
                db.commit()
                print(f"Seeded recommendation for '{inv_name}'.")

        # Check/Seed ActivityLogs
        activities_data = [
            ("sravya", "meeting", "Pitch Sync", "Discussed data pipeline scalability.", "June 28, 2026"),
            ("anushka", "meeting", "Technical sync", "Dived into memory storage schemas.", "June 29, 2026")
        ]
        for inv_name, type_, title, desc, date_str in activities_data:
            inv = seeded_investors[inv_name]
            log = db.query(ActivityLog).filter(ActivityLog.title == title, ActivityLog.investor_id == inv.id).first()
            if not log:
                log = ActivityLog(
                    investor_id=inv.id,
                    owner_id=akshatha_user.id,
                    type=type_,
                    title=title,
                    date=date_str,
                    description=desc,
                    author="akshatha",
                    tags=["Seeded"]
                )
                db.add(log)
                db.commit()
                print(f"Seeded activity log for '{inv_name}'.")

        print("Seeding completed successfully!")
    except Exception as e:
        print(f"Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
