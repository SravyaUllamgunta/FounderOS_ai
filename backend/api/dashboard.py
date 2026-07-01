from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.services.auth_service import get_current_user
from backend.models.user import User
from backend.models.followup import FollowUp
from backend.models.meeting import Meeting
from backend.services.score_service import ScoreService
from backend.services.recommendation_service import RecommendationService
from backend.services.meeting_service import MeetingService
from backend.services.memory_service import MemoryService
from backend.services.activity_log_service import ActivityLogService
from backend.services.dashboard_service import (
    get_startup_profile_dict,
    build_readiness_checklist,
    days_since_date,
    get_dashboard_summary,
)
from backend.schemas.dashboard import DashboardResponse
from datetime import datetime

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pending_recs = RecommendationService.get_pending(db, owner_id=current_user.id)

    pending_followups = (
        db.query(FollowUp)
        .filter(
            FollowUp.owner_id == current_user.id,
            FollowUp.status == "pending",
        )
        .all()
    )

    today = str(datetime.utcnow().date())
    upcoming_meetings = (
        db.query(Meeting)
        .filter(
            Meeting.owner_id == current_user.id,
            Meeting.date >= today,
        )
        .order_by(Meeting.date.asc())
        .all()
    )

    all_meetings = MeetingService.get_all(db, owner_id=current_user.id, limit=999999)
    all_memories = MemoryService.get_all(db, owner_id=current_user.id, limit=999999)
    all_followups = (
        db.query(FollowUp)
        .filter(FollowUp.owner_id == current_user.id)
        .all()
    )

    meetings_list = [{"id": m.id, "date": str(m.date)} for m in all_meetings]
    memories_list = [{"id": m.id, "memory_type": m.memory_type} for m in all_memories]
    followups_list = [{"id": f.id, "status": f.status} for f in all_followups]

    startup_profile = get_startup_profile_dict(db, current_user.id)
    priority_score = ScoreService.calculate_priority_score(meetings_list, memories_list, followups_list)
    readiness_score = ScoreService.calculate_readiness_score(startup_profile, memories_list)
    checklist = build_readiness_checklist(startup_profile, memories_list)
    summary = get_dashboard_summary(db, current_user.id)

    from backend.services.startup_profile_service import StartupProfileService
    completion_stats = StartupProfileService.get_completion(db, current_user.id)

    formatted_actions = []
    for rec in pending_recs:
        formatted_actions.append(
            {
                "id": rec.id,
                "investor_id": rec.investor_id,
                "investor_name": rec.investor.name if rec.investor else "Unknown",
                "investor_firm": rec.investor.firm if rec.investor else "Unknown",
                "action": rec.action,
                "reason": rec.reason,
                "status": rec.status,
                "priority": rec.priority or "Medium",
            }
        )

    formatted_meetings = []
    for m in upcoming_meetings:
        formatted_meetings.append(
            {
                "id": m.id,
                "investor_id": m.investor_id,
                "investor_name": m.investor.name if m.investor else "Unknown",
                "investor_firm": m.investor.firm if m.investor else "Unknown",
                "date": m.date,
                "summary": m.summary or "",
                "sentiment": m.sentiment or "",
                "interest_level": m.interest_level or "",
            }
        )

    formatted_followups = []
    for f in pending_followups:
        meeting = f.meeting
        meeting_date = meeting.date if meeting else ""
        formatted_followups.append(
            {
                "id": f.id,
                "meeting_id": f.meeting_id,
                "investor_id": meeting.investor_id if (meeting and meeting.investor) else "",
                "investor_name": meeting.investor.name if (meeting and meeting.investor) else "Unknown",
                "investor_firm": meeting.investor.firm if (meeting and meeting.investor) else "Unknown",
                "email": f.email,
                "status": f.status,
                "context": (f.email[:120] + "...") if len(f.email) > 120 else f.email,
                "days_since": days_since_date(meeting_date),
            }
        )

    recent_logs = ActivityLogService.get_recent(db, owner_id=current_user.id, limit=10)
    formatted_activity = []
    for log in recent_logs:
        investor_name = log.investor.name if log.investor else ""
        formatted_activity.append(
            {
                "id": log.id,
                "type": log.type,
                "title": log.title,
                "description": log.description,
                "date": log.date,
                "investor_name": investor_name,
            }
        )

    return {
        "summary": summary,
        "scores": {
            "fundraising_readiness_score": readiness_score,
            "priority_score": priority_score,
        },
        "checklist": checklist,
        "pending_actions": formatted_actions,
        "upcoming_meetings": formatted_meetings,
        "pending_followups": formatted_followups,
        "recent_activity": formatted_activity,
        "completion_percentage": completion_stats["completion_percentage"],
        "missing_fields": completion_stats["missing_fields"]
    }
