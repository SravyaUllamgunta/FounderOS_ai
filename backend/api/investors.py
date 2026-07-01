from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.database.session import get_db
from backend.services.auth_service import get_current_user
from backend.models.user import User
from backend.app.db import ActivityLog, Email, Meeting, Note, Recommendation, Reminder
from pydantic import BaseModel
from backend.schemas.investor import InvestorCreate, InvestorResponse
from backend.services.investor_service import InvestorService
from backend.services.meeting_service import MeetingService
from backend.services.recommendation_service import RecommendationService
from backend.services.reminder_service import ReminderService
from backend.services.email_service import EmailService
from backend.services.activity_log_service import ActivityLogService

router = APIRouter(prefix="/investors", tags=["Investors"])

@router.get("")
def list_investors(limit: int = 100, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return [
        investor_payload(investor)
        for investor in InvestorService.get_all(
            db, owner_id=current_user.id, limit=limit, offset=offset
        )
    ]

class NoteCreate(BaseModel):
    content: str


class ReminderCreate(BaseModel):
    title: str
    due_date: str


class TaskToggle(BaseModel):
    task: str
    status: str


def investor_payload(investor):
    return {
        "id": investor.id,
        "name": investor.name,
        "firm": investor.firm,
        "role": investor.role,
        "status": investor.status,
        "lastContact": investor.last_contact,
        "location": investor.location,
        "typicalCheck": investor.typical_check,
        "focus": investor.focus,
        "stage": investor.stage,
        "preferences": investor.preferences,
        "notes": investor.notes,
        "interestScore": investor.interest_score,
    }


@router.get("/{investor_id}")
def get_investor(investor_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    investor = InvestorService.get_by_id(db, investor_id, owner_id=current_user.id)
    if not investor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investor not found"
        )
    meetings = MeetingService.get_all(db, owner_id=current_user.id, investor_id=investor.id)
    recommendations = RecommendationService.get_by_investor(db, investor_id=investor.id, owner_id=current_user.id)
    notes = db.query(Note).filter(Note.investor_id == investor.id, Note.owner_id == current_user.id).all()
    reminders = ReminderService.get_by_investor(db, investor_id=investor.id, owner_id=current_user.id)
    emails = EmailService.get_by_investor(db, investor_id=investor.id, owner_id=current_user.id)
    timeline = ActivityLogService.get_by_investor(db, investor_id=investor.id, owner_id=current_user.id)
    data = investor_payload(investor)
    data.update({
        "meetings": [{
            "id": m.id, "date": m.date, "duration": m.duration,
            "summary": m.summary, "sentiment": m.sentiment,
            "interestLevel": m.interest_level, "interestScore": m.interest_score,
            "concerns": m.concerns, "questions": m.questions,
            "nextSteps": m.next_steps, "actionItems": m.action_items,
            "transcript": m.transcript,
        } for m in meetings],
        "recommendations": [{
            "id": r.id, "next_best_actions": r.next_best_actions,
            "priority": r.priority, "reason": r.reason, "deadline": r.deadline,
        } for r in recommendations],
        "notesList": [{"id": n.id, "content": n.content, "createdAt": n.created_at.isoformat()} for n in notes],
        "reminders": [{"id": r.id, "title": r.title, "dueDate": r.due_date, "status": r.status} for r in reminders],
        "emails": [{"id": e.id, "subject": e.subject, "body": e.body, "tone": e.tone, "type": e.type, "status": e.status} for e in emails],
        "timeline": [{
            "id": t.id, "type": t.type, "title": t.title, "date": t.date,
            "description": t.description, "author": t.author, "tags": t.tags,
        } for t in timeline],
        "tasks": [item for m in meetings for item in (m.action_items or [])],
    })
    return data

@router.post("", response_model=InvestorResponse, status_code=status.HTTP_201_CREATED)
def create_investor(investor_in: InvestorCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return InvestorService.create(db, investor_in, owner_id=current_user.id)


@router.post("/{investor_id}/notes")
def add_note(investor_id: str, payload: NoteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    investor = InvestorService.get_by_id(db, investor_id, current_user.id)
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found")
    note = Note(investor_id=investor.id, owner_id=current_user.id, content=payload.content)
    db.add(note)
    ActivityLogService.create(
        db,
        investor_id=investor.id,
        type_="note",
        title="Founder note added",
        date="Just now",
        description=payload.content,
        author=current_user.full_name,
        tags=["Manual note"],
        owner_id=current_user.id
    )
    db.commit()
    db.refresh(note)
    return {"status": "success", "note_id": note.id}


@router.post("/{investor_id}/reminders")
def add_reminder(investor_id: str, payload: ReminderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    investor = InvestorService.get_by_id(db, investor_id, current_user.id)
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found")
    reminder = ReminderService.create(db, investor_id=investor.id, title=payload.title, due_date=payload.due_date, owner_id=current_user.id)
    return {"status": "success", "reminder_id": reminder.id}


@router.post("/{investor_id}/tasks")
def update_task(investor_id: str, payload: TaskToggle, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    investor = InvestorService.get_by_id(db, investor_id, current_user.id)
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found")
    updated = False
    for meeting in MeetingService.get_all(db, owner_id=current_user.id, investor_id=investor.id):
        items = [dict(item) for item in (meeting.action_items or [])]
        for item in items:
            if item.get("task") == payload.task:
                item["status"] = payload.status
                updated = True
        meeting.action_items = items
    if not updated:
        raise HTTPException(status_code=404, detail="Task not found")
    db.commit()
    return {"status": "success"}
