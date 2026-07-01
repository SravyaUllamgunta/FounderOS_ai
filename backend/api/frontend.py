"""Authenticated endpoints consumed by the Next.js application."""

import logging
import uuid
from typing import List, Optional, Union

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

logger = logging.getLogger("frontend_api")
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.agents.communication_agent import CommunicationOutput, draft_communication
from backend.schemas.communication import CommunicationRequest
from backend.agents.explanation_agent import ExplanationOutput, explain_recommendation
from backend.agents.extraction_agent import ExtractionOutput, extract_meeting_info
from backend.agents.recommendation_agent import RecommendationOutput, generate_recommendations
from backend.app.db import Email, Investor, Meeting, Notification, User
from backend.database.session import get_db
from backend.services.auth_service import get_current_user
from backend.services.email_service import EmailService
from backend.services.notification_service import NotificationService
from backend.services.dashboard_service import get_dashboard_summary

router = APIRouter(tags=["Frontend"])


class ExtractRequest(BaseModel):
    transcript_text: str


class RecommendRequest(BaseModel):
    investor_profile: Optional[str] = ""
    meeting_summary: str
    memory: Optional[str] = ""
    past_meetings: Optional[Union[str, List[str]]] = ""


class ExplainRequest(BaseModel):
    recommendation: str
    investor_memory: Optional[str] = ""
    meeting_history: Optional[str] = ""


class MeetingPersistRequest(BaseModel):
    investor_id: Optional[str] = None
    investor_name: str
    firm: str
    transcript: str
    summary: str
    date: str
    duration: Optional[str] = "30 mins"
    sentiment: Optional[str] = "Neutral"
    interest_level: Optional[str] = "Medium"
    interest_score: Optional[int] = 70
    concerns: List[str] = []
    questions: List[str] = []
    next_steps: List[str] = []
    action_items: List[dict] = []
    follow_up_date: Optional[str] = ""
    recommendations: Optional[List[str]] = None
    recommendation_reason: Optional[str] = None
    recommendation_priority: Optional[str] = "Medium"
    recommendation_deadline: Optional[str] = ""



class EmailRequest(BaseModel):
    investor_id: str
    subject: str
    body: str
    tone: str = "Professional"
    type: str = "Follow-up Email"
    draft_id: Optional[int] = None


def owned_investor(db: Session, investor_id: str, user_id: int) -> Investor:
    investor = db.query(Investor).filter(
        Investor.id == investor_id,
        Investor.owner_id == user_id,
    ).first()
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found")
    return investor


@router.get("/health")
def health(db: Session = Depends(get_db)):
    db.execute(__import__("sqlalchemy").text("SELECT 1"))
    return {"status": "healthy", "database": "ready"}


@router.get("/dashboard/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    summary = get_dashboard_summary(db, current_user.id)
    return {
        "founder_name": current_user.full_name,
        **summary,
    }


@router.get("/search")
def search(
    query: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    value = f"%{query.strip()}%"
    if value == "%%":
        return []
    investors = db.query(Investor).filter(
        Investor.owner_id == current_user.id,
        (Investor.name.ilike(value)) |
        (Investor.firm.ilike(value)) |
        (Investor.location.ilike(value)),
    ).limit(10).all()
    return [{
        "id": investor.id,
        "name": investor.name,
        "firm": investor.firm,
        "role": investor.role,
        "location": investor.location,
        "typical_check": investor.typical_check,
        "status": investor.status,
        "match_score": 100,
    } for investor in investors]


@router.get("/notifications")
def notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = NotificationService.get_all(db, owner_id=current_user.id)
    return [{
        "id": row.id,
        "title": row.title,
        "description": row.description,
        "link": row.link,
        "isRead": row.is_read,
        "createdAt": row.created_at.isoformat(),
    } for row in rows]


@router.post("/notifications/{notification_id}/read")
def read_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = NotificationService.get_by_id(db, notification_id, owner_id=current_user.id)
    if not row:
        raise HTTPException(status_code=404, detail="Notification not found")
    row.is_read = True
    db.commit()
    return {"status": "success"}


@router.post("/send-email")
def save_email(
    payload: EmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    investor = owned_investor(db, payload.investor_id, current_user.id)
    email = EmailService.create(
        db,
        investor_id=investor.id,
        subject=payload.subject,
        body=payload.body,
        tone=payload.tone,
        type_=payload.type,
        owner_id=current_user.id
    )
    
    # Update followup if draft_id provided
    if payload.draft_id is not None:
        from backend.models.followup import FollowUp
        followup = db.query(FollowUp).filter(
            FollowUp.id == payload.draft_id,
            FollowUp.owner_id == current_user.id
        ).first()
        if followup:
            followup.status = "sent"
            
    # Create Activity timeline log for email
    from backend.services.activity_log_service import ActivityLogService
    ActivityLogService.create(
        db,
        investor_id=investor.id,
        type_="email",
        title=f"Sent follow-up email: {payload.subject}",
        date="Just now",
        description=payload.body,
        author=current_user.full_name,
        tags=[payload.type],
        owner_id=current_user.id
    )
    db.commit()
    
    return {
        "status": "success",
        "message": "Draft saved. External email delivery is not configured.",
        "email_id": email.id,
    }


@router.post("/upload")
async def inspect_upload(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    return {
        "status": "accepted",
        "file_name": file.filename,
        "content_type": file.content_type,
    }


@router.post("/extract", response_model=ExtractionOutput)
def extract(
    payload: ExtractRequest,
    current_user: User = Depends(get_current_user),
):
    request_id = str(uuid.uuid4())[:8]
    transcript = payload.transcript_text
    
    if transcript is None:
        logger.error(f"[{request_id}] Transcript extraction failed: transcript is None")
        raise HTTPException(status_code=400, detail="Transcript extraction failed.")
        
    logger.info(f"[{request_id}] Extracted Characters: {len(transcript)}")
    logger.info(f"[{request_id}] Extracted Preview: {transcript[:500]}")
    
    if not transcript.strip():
        logger.error(f"[{request_id}] Transcript extraction failed: transcript is empty")
        raise HTTPException(status_code=400, detail="Transcript extraction failed.")
        
    return extract_meeting_info(transcript, request_id=request_id)


@router.post("/extract-file", response_model=ExtractionOutput)
async def extract_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    request_id = str(uuid.uuid4())[:8]
    content = await file.read()
    if file.content_type not in {"text/plain", "text/markdown", "application/pdf"}:
        raise HTTPException(
            status_code=415,
            detail="Only text, Markdown, and text-based PDF transcripts are supported",
        )
    if file.content_type == "application/pdf":
        from io import BytesIO
        from pypdf import PdfReader
        text = "\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(content)).pages)
    else:
        text = content.decode("utf-8")
        
    transcript = text
    if transcript is None:
        logger.error(f"[{request_id}] Transcript extraction failed: transcript is None")
        raise HTTPException(status_code=400, detail="Transcript extraction failed.")
        
    logger.info(f"[{request_id}] Extracted Characters: {len(transcript)}")
    logger.info(f"[{request_id}] Extracted Preview: {transcript[:500]}")
    
    if not transcript.strip():
        logger.error(f"[{request_id}] Transcript extraction failed: transcript is empty")
        raise HTTPException(status_code=400, detail="Transcript extraction failed.")
        
    return extract_meeting_info(transcript, request_id=request_id)


@router.post("/meetings/persist")
def persist_meeting(
    payload: MeetingPersistRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger.info("Meeting analysis completed")
    logger.info("Calling persistence API")

    from backend.services.investor_service import InvestorService
    from backend.schemas.investor import InvestorCreate
    from backend.app.db import Memory, Recommendation, FollowUp, ActivityLog
    from backend.services.memory_service import MemoryService
    from backend.schemas.memory import MemoryCreate
    from backend.tools.qdrant_tool import QdrantTool
    from backend.tools.embedding_tool import EmbeddingTool
    from backend.agents.communication_agent import draft_communication
    
    # 1. Find or create investor
    investor = None
    if payload.investor_id:
        investor = db.query(Investor).filter(
            Investor.id == payload.investor_id,
            Investor.owner_id == current_user.id
        ).first()
    
    if not investor:
        # fuzzy matching
        investor = InvestorService.get_by_name(db, name=payload.investor_name, owner_id=current_user.id)
        
    if not investor:
        # Create a new investor profile
        investor_in = InvestorCreate(
            name=payload.investor_name,
            firm=payload.firm,
            role="Partner",
            status="Active Diligence",
            location="India",
            typical_check="₹25L",
            focus=[],
            stage="Seed",
            preferences={},
            notes=payload.summary,
            interest_score=payload.interest_score or 70
        )
        investor = InvestorService.create(db, investor_in, owner_id=current_user.id)
        
        # Log timeline activity for new relationship
        from backend.services.activity_log_service import ActivityLogService
        ActivityLogService.create(
            db,
            investor_id=investor.id,
            type_="diligence",
            title="Relationship Initialized",
            date=payload.date,
            description=f"New investor profile created for {payload.investor_name} at {payload.firm} via transcript upload.",
            author=current_user.full_name,
            tags=["Onboarding"],
            owner_id=current_user.id
        )
        db.commit()

    # 2. Store meeting in SQL database
    db_meeting = Meeting(
        investor_id=investor.id,
        owner_id=current_user.id,
        date=payload.date,
        duration=payload.duration or "30 mins",
        summary=payload.summary,
        transcript=payload.transcript,
        sentiment=payload.sentiment or "Neutral",
        interest_level=payload.interest_level or "Medium",
        interest_score=payload.interest_score or 70,
        concerns=payload.concerns,
        questions=payload.questions,
        next_steps=payload.next_steps,
        action_items=payload.action_items,
        follow_up_date=payload.follow_up_date or "",
    )
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    logger.info("Meeting persisted successfully")

    # Instantiate Qdrant
    try:
        qdrant = QdrantTool()
    except Exception as e:
        print(f"Warning: Qdrant setup failed: {e}")
        qdrant = None

    # 3. Create memories from LLM extraction results (concerns & action items)
    # Save concerns
    for concern in payload.concerns:
        try:
            MemoryService.create(
                db, qdrant,
                MemoryCreate(investor_id=investor.id, memory=concern, memory_type="concern"),
                owner_id=current_user.id
            )
        except Exception as e:
            print(f"Failed to create concern memory: {e}")
    
    # Save action items
    for item in payload.action_items:
        task_text = item.get("task", "")
        if task_text:
            try:
                MemoryService.create(
                    db, qdrant,
                    MemoryCreate(investor_id=investor.id, memory=task_text, memory_type="action_item"),
                    owner_id=current_user.id
                )
            except Exception as e:
                print(f"Failed to create action item memory: {e}")
                
    # Save other facts
    relationship_notes = []
    if payload.sentiment:
        relationship_notes.append(f"Sentiment: {payload.sentiment} (Interest level: {payload.interest_level})")
    for note in relationship_notes:
        try:
            MemoryService.create(
                db, qdrant,
                MemoryCreate(investor_id=investor.id, memory=note, memory_type="relationship_note"),
                owner_id=current_user.id
            )
        except Exception as e:
            print(f"Failed to create relationship note: {e}")

    # 4. Store raw transcript in Qdrant 'meeting_transcripts'
    if qdrant and db_meeting.transcript:
        try:
            vector = EmbeddingTool.generate_embedding(db_meeting.transcript)
            qdrant.upsert_vector(
                collection="meeting_transcripts",
                point_id=db_meeting.id,
                vector=vector,
                payload={
                    "id": db_meeting.id,
                    "owner_id": current_user.id,
                    "investor_id": investor.id,
                    "transcript": db_meeting.transcript
                }
            )
        except Exception as e:
            print(f"Warning: Failed to index raw meeting transcript in Qdrant: {e}")

    # 5. Store concise summary in Qdrant 'investor_notes'
    if qdrant and db_meeting.summary:
        try:
            vector = EmbeddingTool.generate_embedding(db_meeting.summary)
            qdrant.upsert_vector(
                collection="investor_notes",
                point_id=db_meeting.id,
                vector=vector,
                payload={
                    "id": db_meeting.id,
                    "owner_id": current_user.id,
                    "investor_id": investor.id,
                    "note": db_meeting.summary
                }
            )
        except Exception as e:
            print(f"Warning: Failed to index concise summary in Qdrant 'investor_notes': {e}")

    # 6. Save Recommendation
    recommendations = payload.recommendations
    rec_reason = payload.recommendation_reason
    rec_priority = payload.recommendation_priority
    rec_deadline = payload.recommendation_deadline

    if not recommendations:
        from backend.agents.recommendation_agent import generate_recommendations
        try:
            rec_out = generate_recommendations(
                investor_profile=f"{investor.name} - Partner at {investor.firm}",
                meeting_summary=payload.summary,
                memory=f"Interest level is graded {payload.interest_level or 'Medium'}. Concerns: {', '.join(payload.concerns)}",
                past_meetings=""
            )
            recommendations = rec_out.next_best_actions
            rec_reason = rec_out.reason
            rec_priority = rec_out.priority
            rec_deadline = rec_out.deadline
        except Exception as e:
            print(f"Warning: Failed to generate recommendations during auto-persist: {e}")
            recommendations = ["Send follow-up email."]
            rec_reason = "To address meeting next steps."
            rec_priority = "Medium"
            rec_deadline = "Next week"

    if recommendations:
        rec_action = recommendations[0] if recommendations else "Send follow-up"
        db_rec = Recommendation(
            investor_id=investor.id,
            owner_id=current_user.id,
            action=rec_action,
            next_best_actions=recommendations,
            priority=rec_priority or "Medium",
            reason=rec_reason or "Based on recent meeting analysis.",
            deadline=rec_deadline or "Next week",
            status="pending"
        )
        db.add(db_rec)
        db.commit()

    logger.info("Creating follow-up")
    # 7. Create pending FollowUp
    try:
        email_draft = draft_communication(
            investor_name=investor.name,
            communication_type="Follow-up Email",
            tone="Professional",
            meeting_context=payload.summary,
            founder_message="Great speaking with you about our developer workflow and data pipelines."
        )
        email_body = email_draft.body
    except Exception as e:
        print(f"Warning: Failed to draft follow-up email via agent: {e}")
        email_body = f"Hi {investor.name},\n\nGreat speaking with you. Here are the notes from our meeting:\n\n{payload.summary}\n\nBest regards,\nFounder"

    db_followup = FollowUp(
        meeting_id=db_meeting.id,
        owner_id=current_user.id,
        email=email_body,
        status="pending"
    )
    db.add(db_followup)
    
    # Log timeline activity for meeting
    from backend.services.activity_log_service import ActivityLogService
    ActivityLogService.create(
        db,
        investor_id=investor.id,
        type_="meeting",
        title=f"Meeting: {payload.summary[:50]}...",
        date=payload.date,
        description=payload.summary,
        author=current_user.full_name,
        tags=["Meeting", payload.interest_level or "Neutral"],
        owner_id=current_user.id
    )
    db.commit()
    logger.info("Updating dashboard")

    return {
        "status": "success",
        "meeting_id": db_meeting.id,
        "investor_id": investor.id,
        "investor_name": investor.name,
        "firm": investor.firm
    }


@router.post("/recommend", response_model=RecommendationOutput)
def recommend(
    payload: RecommendRequest,
    current_user: User = Depends(get_current_user),
):
    history = (
        "\n".join(payload.past_meetings)
        if isinstance(payload.past_meetings, list)
        else payload.past_meetings
    )
    return generate_recommendations(
        investor_profile=payload.investor_profile or "",
        meeting_summary=payload.meeting_summary,
        memory=payload.memory or "",
        past_meetings=history or "",
    )


@router.post("/explain", response_model=ExplanationOutput)
def explain(
    payload: ExplainRequest,
    current_user: User = Depends(get_current_user),
):
    return explain_recommendation(
        recommendation=payload.recommendation,
        investor_memory=payload.investor_memory or "",
        meeting_history=payload.meeting_history or "",
    )


@router.post("/communication", response_model=CommunicationOutput)
def communicate(
    payload: CommunicationRequest,
    current_user: User = Depends(get_current_user),
):
    return draft_communication(
        investor_name=payload.investor_name,
        communication_type=payload.communication_type,
        tone=payload.tone,
        meeting_context=payload.meeting_context or "",
        founder_message=payload.founder_message or "",
        attachments=payload.attachments or [],
        additional_instructions=payload.additional_instructions or ""
    )


@router.get("/followups/context")
def get_followup_context(
    investor_name: Optional[str] = None,
    investor_id: Optional[str] = None,
    draft_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetches context (recent meeting summary, commitments, key memories) to prefill the composer.
    """
    from backend.services.investor_service import InvestorService
    from backend.services.meeting_service import MeetingService
    from backend.services.memory_service import MemoryService
    from backend.models.followup import FollowUp
    
    investor = None
    if investor_id:
        investor = InvestorService.get_by_id(db, investor_id, current_user.id)
    elif investor_name:
        investor = InvestorService.get_by_name(db, investor_name, current_user.id)
        
    email_draft_body = ""
    email_draft_subject = ""
    
    if draft_id is not None:
        followup = db.query(FollowUp).filter(
            FollowUp.id == draft_id,
            FollowUp.owner_id == current_user.id
        ).first()
        if followup:
            email_draft_body = followup.email
            email_draft_subject = f"Follow-up: {investor.name if investor else 'Meeting'}"
            
    if not investor:
        return {
            "meeting_context": "No active CRM context found. Standard outbound detail prefilled.",
            "founder_message": "",
            "attachments": [],
            "subject": email_draft_subject,
            "body": email_draft_body
        }
        
    # Get last meeting
    meetings = MeetingService.get_all(db, current_user.id, investor.id)
    last_meeting_summary = meetings[0].summary if meetings else ""
    
    # Get memories
    memories = MemoryService.get_all(db, current_user.id, investor.id)
    memories_str = "; ".join([m.memory for m in memories])
    
    context_str = f"Investor: {investor.name} from {investor.firm}. "
    if last_meeting_summary:
        context_str += f"Last meeting summary: {last_meeting_summary}. "
    if memories_str:
        context_str += f"Key relationship memories: {memories_str}."
        
    return {
        "meeting_context": context_str,
        "founder_message": f"Great speaking with you about our developer workflow and data pipelines.",
        "attachments": [],
        "subject": email_draft_subject,
        "body": email_draft_body
    }

