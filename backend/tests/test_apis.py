import os
import sys
import random

# Ensure backend directory is in python search path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.main import app

def test_rest_apis():
    print("Verifying REST API endpoints via TestClient...")
    client = TestClient(app)
    
    # 1. Health check
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    print("  [OK] Health check passed.")

    # 2. Register user
    rand_id = random.randint(10000, 99999)
    email = f"founder_{rand_id}@founderos.ai"
    reg_response = client.post(
        "/api/auth/register",
        json={"name": "Test Founder", "email": email, "password": "founderpassword123"}
    )
    assert reg_response.status_code == 201
    print(f"  [OK] Register API passed. Created: {email}")

    # 3. Login and fetch JWT Bearer token
    login_response = client.post(
        "/api/auth/login",
        data={"username": email, "password": "founderpassword123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("  [OK] Login API passed. JWT Token retrieved.")

    # 4. Get Dashboard
    dash_response = client.get("/api/dashboard", headers=headers)
    assert dash_response.status_code == 200
    dash_data = dash_response.json()
    assert "summary" in dash_data
    assert "scores" in dash_data
    assert "checklist" in dash_data
    assert "pending_actions" in dash_data
    assert "upcoming_meetings" in dash_data
    assert "pending_followups" in dash_data
    assert "recent_activity" in dash_data
    assert "fundraising_readiness_score" in dash_data["scores"]
    assert "priority_score" in dash_data["scores"]
    assert isinstance(dash_data["checklist"], list)
    assert isinstance(dash_data["recent_activity"], list)
    print("  [OK] Dashboard API passed.")

    # 5. Create Investor
    inv_response = client.post(
        "/api/investors",
        headers=headers,
        json={
            "name": "Sequoia Capital",
            "firm": "Sequoia",
            "focus": ["AI", "SaaS", "Enterprise"],
            "stage": "Seed",
            "preferences": {"min_check_size": 250000, "max_check_size": 1500000}
        }
    )
    assert inv_response.status_code == 201
    investor_id = inv_response.json()["id"]
    print(f"  [OK] Create Investor API passed. Investor ID: {investor_id}")

    # 6. List Investors
    list_inv_response = client.get("/api/investors", headers=headers)
    assert list_inv_response.status_code == 200
    assert len(list_inv_response.json()) > 0
    print("  [OK] List Investors API passed.")

    # Confirm a second founder cannot see or write data under the first founder.
    second_email = f"other_founder_{rand_id}@founderos.ai"
    second_reg = client.post(
        "/api/auth/register",
        json={"name": "Other Founder", "email": second_email, "password": "founderpassword123"}
    )
    assert second_reg.status_code == 201
    second_login = client.post(
        "/api/auth/login",
        data={"username": second_email, "password": "founderpassword123"}
    )
    second_headers = {
        "Authorization": f"Bearer {second_login.json()['access_token']}"
    }
    second_list = client.get("/api/investors", headers=second_headers)
    assert second_list.status_code == 200
    assert all(item["id"] != investor_id for item in second_list.json())
    second_get = client.get(f"/api/investors/{investor_id}", headers=second_headers)
    assert second_get.status_code == 404
    forbidden_memory = client.post(
        "/api/memory",
        headers=second_headers,
        json={
            "investor_id": investor_id,
            "memory": "Must not cross tenant boundaries.",
            "memory_type": "meeting_note"
        }
    )
    assert forbidden_memory.status_code == 404
    print("  [OK] Tenant isolation checks passed.")

    # 7. Create Memory
    mem_response = client.post(
        "/api/memory",
        headers=headers,
        json={
            "investor_id": investor_id,
            "memory": "Sequoia prefers capital-efficient B2B startups.",
            "memory_type": "preference"
        }
    )
    assert mem_response.status_code == 201
    memory_id = mem_response.json()["id"]
    print(f"  [OK] Create Memory API passed. Memory ID: {memory_id}")

    # 8. List Memories
    list_mem_response = client.get("/api/memory", headers=headers, params={"investor_id": investor_id})
    assert list_mem_response.status_code == 200
    assert len(list_mem_response.json()) > 0
    print("  [OK] List Memory API passed.")

    # 9. Matchmaking Ranker
    match_response = client.post(
        "/api/matchmaking",
        headers=headers,
        json={
            "industries": ["AI", "SaaS"],
            "stage": "Seed",
            "target_raise": 500000
        }
    )
    assert match_response.status_code == 200
    rankings = match_response.json()
    assert len(rankings) > 0
    # Check if Sequoia is in the rankings
    sequoia_match = next((item for item in rankings if item["investor_id"] == investor_id), None)
    assert sequoia_match is not None
    print(f"  [OK] Matchmaking Ranker API passed. Sequoia Match Score: {sequoia_match['match_score']}%")

    # 10. Orchestrate LangGraph Query
    orch_response = client.post(
        "/api/orchestrate",
        headers=headers,
        json={"query": "I met Sequoia Capital today to present our seed deck."}
    )
    assert orch_response.status_code == 200
    orch_result = orch_response.json()
    assert "workflow" in orch_result
    print(f"  [OK] Orchestration API passed. Selected workflow: {orch_result['workflow']}")

    print("\nSuccess: All API contract tests completed successfully!")

if __name__ == "__main__":
    test_rest_apis()
