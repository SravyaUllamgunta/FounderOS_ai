import os
import sys

# Ensure backend directory is in python search path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.main import app
from backend.database.session import SessionLocal
from backend.app.db import User, Investor, Meeting, Memory, Recommendation, FollowUp, ActivityLog, Email

def run_test():
    print("Starting Meeting Persistence End-to-End Test...")
    client = TestClient(app)
    
    # 1. Login user
    email = "akshatha@gmail.com"
    login_response = client.post(
        "/api/auth/login",
        data={"username": email, "password": "akshatha"}
    )
    assert login_response.status_code == 200, f"Login failed: {login_response.text}"
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("  [OK] Logged in successfully.")

    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    assert user is not None
    
    # Clean up any leftover test investor from previous crashed runs
    leftover = db.query(Investor).filter(Investor.name == "Test Investor LLC", Investor.owner_id == user.id).first()
    if leftover:
        db.query(Memory).filter(Memory.investor_id == leftover.id).delete()
        db.query(Recommendation).filter(Recommendation.investor_id == leftover.id).delete()
        db.query(Email).filter(Email.investor_id == leftover.id).delete()
        meetings = db.query(Meeting).filter(Meeting.investor_id == leftover.id).all()
        for m in meetings:
            db.query(FollowUp).filter(FollowUp.meeting_id == m.id).delete()
            db.delete(m)
        db.query(ActivityLog).filter(ActivityLog.investor_id == leftover.id).delete()
        db.delete(leftover)
        db.commit()
    
    # 2. Get initial dashboard state
    dash_before = client.get("/api/dashboard", headers=headers).json()
    followups_before = dash_before["summary"]["pending_followups"]
    print(f"  [INFO] Pending followups count before: {followups_before}")
    
    # 3. Call meetings/persist
    persist_payload = {
        "investor_name": "Test Investor LLC",
        "firm": "LLC Ventures",
        "transcript": "Raw discussion details with Test Investor regarding AI B2B tools.",
        "summary": "Pitched FounderOS. Investor was highly aligned and wanted to review references next week.",
        "date": "2026-07-01",
        "duration": "45 mins",
        "sentiment": "Highly Engaged",
        "interest_level": "High",
        "interest_score": 90,
        "concerns": [
            "Scale-up performance constraints.",
            "Long sales cycles in enterprise segments."
        ],
        "questions": [
            "What is your long-term defensive moat?"
        ],
        "next_steps": [
            "Send updated pitch deck detailing ARR metrics."
        ],
        "action_items": [
            {"task": "Send updated pitch deck detailing ARR metrics.", "status": "pending"}
        ],
        "follow_up_date": "2026-07-08",
        "recommendations": ["Prepare customer reference documents.", "Schedule next partner sync."],
        "recommendation_reason": "Provide references as requested.",
        "recommendation_priority": "High",
        "recommendation_deadline": "2026-07-05"
    }
    
    print("  [INFO] Posting persist request to /api/meetings/persist...")
    response = client.post(
        "/api/meetings/persist",
        headers=headers,
        json=persist_payload
    )
    
    assert response.status_code == 200, f"Persist failed: {response.text}"
    res_data = response.json()
    assert res_data["status"] == "success"
    meeting_id = res_data["meeting_id"]
    investor_id = res_data["investor_id"]
    print(f"  [OK] Persist API passed. Meeting ID: {meeting_id}, Investor ID: {investor_id}")
    
    # 4. Verify SQL DB entries
    # Verify Meeting
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    assert meeting is not None
    assert meeting.investor_id == investor_id
    assert meeting.duration == "45 mins"
    assert meeting.sentiment == "Highly Engaged"
    print("  [OK] Meeting row verified in SQL.")
    
    # Verify Memories
    memories = db.query(Memory).filter(Memory.investor_id == investor_id).all()
    assert len(memories) >= 3 # concerns, action items, sentiment
    concern_mem = [m for m in memories if m.memory_type == "concern"]
    assert len(concern_mem) == 2
    print(f"  [OK] Memories verified (Concerns count: {len(concern_mem)}).")
    
    # Verify Recommendation
    rec = db.query(Recommendation).filter(
        Recommendation.investor_id == investor_id,
        Recommendation.status == "pending"
    ).first()
    assert rec is not None
    assert rec.priority == "High"
    print("  [OK] Recommendation row verified in SQL.")
    
    # Verify FollowUp
    followup = db.query(FollowUp).filter(FollowUp.meeting_id == meeting_id).first()
    assert followup is not None
    assert followup.status == "pending"
    print("  [OK] FollowUp row verified in SQL.")
    
    # Verify ActivityLog
    activity = db.query(ActivityLog).filter(
        ActivityLog.investor_id == investor_id,
        ActivityLog.type == "meeting"
    ).first()
    assert activity is not None
    print("  [OK] ActivityLog verified on the timeline.")
    
    # 5. Verify dashboard state update
    dash_after = client.get("/api/dashboard", headers=headers).json()
    followups_after = dash_after["summary"]["pending_followups"]
    print(f"  [INFO] Pending followups count after: {followups_after}")
    assert followups_after == followups_before + 1, "Dashboard pending followups count did not increment"
    print("  [OK] Dashboard pending_followups count incremented successfully.")
    
    # 6. Verify send-email marks followup sent and creates activity log
    print("  [INFO] Sending email via /api/send-email to verify status change...")
    email_response = client.post(
        "/api/send-email",
        headers=headers,
        json={
            "investor_id": investor_id,
            "subject": "Follow-up notes",
            "body": followup.email,
            "tone": "Professional",
            "type": "Follow-up Email",
            "draft_id": followup.id
        }
    )
    assert email_response.status_code == 200, f"Send email failed: {email_response.text}"
    
    # Verify FollowUp status is updated
    db.refresh(followup)
    assert followup.status == "sent"
    print("  [OK] FollowUp status updated to 'sent'.")
    
    # Verify Dashboard count decremented back
    dash_final = client.get("/api/dashboard", headers=headers).json()
    followups_final = dash_final["summary"]["pending_followups"]
    print(f"  [INFO] Pending followups count final: {followups_final}")
    assert followups_final == followups_before
    print("  [OK] Dashboard pending_followups count decremented successfully.")
    
    # Clean up test rows to keep DB clean
    db.delete(followup)
    db.delete(rec)
    for m in memories:
        db.delete(m)
    db.delete(meeting)
    db.commit()
    
    # Clean up investor
    db.query(Email).filter(Email.investor_id == investor_id).delete()
    db.query(ActivityLog).filter(ActivityLog.investor_id == investor_id).delete()
    db.query(Investor).filter(Investor.id == investor_id).delete()
    db.commit()
    db.close()
    print("All E2E Persistence tests passed successfully!")

if __name__ == "__main__":
    run_test()
