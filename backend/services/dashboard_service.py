from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy.orm import Session

from backend.app.db import Investor, Meeting, FollowUp
from backend.services.email_service import EmailService


CHECKLIST_ITEMS = [
    ("has_deck", "Pitch Deck Refined", "Deck ready for sharing"),
    ("has_financial_model", "Financial Model", "3-year forecast modeled"),
    ("has_cap_table", "Cap Table", "Ownership structure documented"),
    ("has_one_pager", "One Pager", "Executive summary prepared"),
    ("has_legal_setup", "Legal Setup", "Entity and legal docs in place"),
]

def get_startup_profile_dict(db: Session, owner_id: int) -> Dict[str, Any]:
    from backend.app.db import StartupProfile
    profile = db.query(StartupProfile).filter(StartupProfile.owner_id == owner_id).first()
    if not profile:
        return {
            "industries": [],
            "stage": "",
            "target_raise": 0.0,
            "has_deck": False,
            "has_financial_model": False,
            "has_cap_table": False,
            "has_one_pager": False,
            "has_legal_setup": False
        }
    
    industries = [ind.strip() for ind in profile.industry.split(",")] if profile.industry else []
    return {
        "industries": industries,
        "stage": profile.stage or "",
        "target_raise": profile.amount_raising or 0.0,
        "has_deck": profile.has_deck or False,
        "has_financial_model": profile.has_financial_model or False,
        "has_cap_table": profile.has_cap_table or False,
        "has_one_pager": profile.has_one_pager or False,
        "has_legal_setup": profile.has_legal_setup or False
    }



def get_dashboard_summary(db: Session, owner_id: int) -> Dict[str, int]:
    investors = db.query(Investor).filter(Investor.owner_id == owner_id).all()
    investor_ids = [investor.id for investor in investors]
    today = str(datetime.utcnow().date())
    upcoming_count = (
        db.query(Meeting)
        .filter(
            Meeting.investor_id.in_(investor_ids),
            Meeting.owner_id == owner_id,
            Meeting.date >= today,
        )
        .count()
        if investor_ids
        else 0
    )
    pending_count = (
        db.query(FollowUp)
        .filter(
            FollowUp.owner_id == owner_id,
            FollowUp.status == "pending",
        )
        .count()
    )
    return {
        "active_investors": sum(1 for investor in investors if investor.status != "Passed"),
        "soft_committed": sum(1 for investor in investors if investor.status == "Soft Committed"),
        "upcoming_meetings": upcoming_count,
        "pending_followups": pending_count,
    }


def build_readiness_checklist(
    startup_profile: Dict[str, Any],
    memories_list: List[Dict[str, Any]],
) -> List[Dict[str, str]]:
    checklist: List[Dict[str, str]] = []
    for key, name, completed_detail in CHECKLIST_ITEMS:
        is_done = startup_profile.get(key) is True or startup_profile.get(key) in ["true", "True", 1]
        checklist.append(
            {
                "name": name,
                "status": "completed" if is_done else "pending",
                "details": completed_detail if is_done else "Not yet completed",
            }
        )

    concern_count = sum(1 for m in memories_list if m.get("memory_type") == "concern")
    if concern_count > 0:
        checklist.append(
            {
                "name": "Investor Concerns",
                "status": "warning",
                "details": f"{concern_count} open concern(s) flagged in meeting memory",
            }
        )

    return checklist


def days_since_date(date_str: str) -> int:
    if not date_str:
        return 0
    try:
        meeting_date = datetime.strptime(date_str[:10], "%Y-%m-%d").date()
        return max(0, (datetime.utcnow().date() - meeting_date).days)
    except ValueError:
        return 0
