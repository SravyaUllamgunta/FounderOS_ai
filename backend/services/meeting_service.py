from sqlalchemy.orm import Session
from typing import List, Optional
from backend.models.meeting import Meeting
from backend.models.investor import Investor
from backend.schemas.meeting import MeetingCreate
from backend.tools.embedding_tool import EmbeddingTool
from backend.tools.qdrant_tool import QdrantTool

class MeetingService:
    @staticmethod
    def get_all(db: Session, owner_id: int, investor_id: Optional[str] = None, limit: int = 100, offset: int = 0) -> List[Meeting]:
        query = db.query(Meeting).filter(Meeting.owner_id == owner_id)
        if investor_id is not None:
            query = query.filter(Meeting.investor_id == investor_id)
        return query.order_by(Meeting.date.desc()).offset(offset).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, meeting_id: str, owner_id: int) -> Optional[Meeting]:
        return (
            db.query(Meeting)
            .filter(Meeting.id == meeting_id, Meeting.owner_id == owner_id)
            .first()
        )

    @staticmethod
    def create(db: Session, qdrant: QdrantTool, meeting_in: MeetingCreate, owner_id: int) -> Meeting:
        investor = (
            db.query(Investor)
            .filter(Investor.id == meeting_in.investor_id, Investor.owner_id == owner_id)
            .first()
        )
        if not investor:
            raise ValueError("Investor not found")

        extracted_summary = meeting_in.summary or ""
        extracted = None
        
        # Lazy imports of agents and services to resolve sys.path dynamically
        from backend.agents.extraction_agent import extract_meeting_info
        from backend.schemas.memory import MemoryCreate
        from backend.services.memory_service import MemoryService

        # 1. Run LLM Extraction if transcript exists
        if meeting_in.transcript and meeting_in.transcript.strip():
            try:
                extracted = extract_meeting_info(meeting_in.transcript)
                extracted_summary = extracted.summary
            except Exception as e:
                print(f"Warning: Transcript extraction failed: {e}")
                extracted_summary = meeting_in.summary or "Meeting summary could not be extracted."

        # 2. Store meeting in SQL database
        db_meeting = Meeting(
            investor_id=meeting_in.investor_id,
            owner_id=owner_id,
            transcript=meeting_in.transcript,
            summary=extracted_summary,
            date=meeting_in.date
        )
        db.add(db_meeting)
        db.commit()
        db.refresh(db_meeting)

        # 3. Create memories from LLM extraction results (durable facts)
        if extracted:
            # Save concerns
            for concern in extracted.concerns:
                try:
                    MemoryService.create(
                        db, qdrant,
                        MemoryCreate(investor_id=db_meeting.investor_id, memory=concern, memory_type="concern"),
                        owner_id=owner_id
                    )
                except Exception as e:
                    print(f"Failed to create concern memory: {e}")
            
            # Save action items
            for step in extracted.next_steps:
                try:
                    MemoryService.create(
                        db, qdrant,
                        MemoryCreate(investor_id=db_meeting.investor_id, memory=step, memory_type="action_item"),
                        owner_id=owner_id
                    )
                except Exception as e:
                    print(f"Failed to create action item memory: {e}")
            
            # Save other facts (sentiment/commitments)
            relationship_notes = []
            if extracted.commitments:
                relationship_notes.append(f"Commitments: {extracted.commitments}")
            if extracted.sentiment:
                relationship_notes.append(f"Sentiment: {extracted.sentiment} (Interest level: {extracted.interest_level})")
                
            for note in relationship_notes:
                try:
                    MemoryService.create(
                        db, qdrant,
                        MemoryCreate(investor_id=db_meeting.investor_id, memory=note, memory_type="relationship_note"),
                        owner_id=owner_id
                    )
                except Exception as e:
                    print(f"Failed to create relationship note: {e}")

        # 4. Store raw transcript in Qdrant 'meeting_transcripts'
        try:
            content_to_embed = db_meeting.transcript
            if content_to_embed:
                vector = EmbeddingTool.generate_embedding(content_to_embed)
                qdrant.upsert_vector(
                    collection="meeting_transcripts",
                    point_id=db_meeting.id,
                    vector=vector,
                    payload={
                        "id": db_meeting.id,
                        "owner_id": owner_id,
                        "investor_id": db_meeting.investor_id,
                        "transcript": db_meeting.transcript
                    }
                )
        except Exception as e:
            print(f"Warning: Failed to index raw meeting transcript in Qdrant: {e}")

        # 5. Store concise summary in Qdrant 'investor_notes'
        try:
            if extracted_summary:
                vector = EmbeddingTool.generate_embedding(extracted_summary)
                qdrant.upsert_vector(
                    collection="investor_notes",
                    point_id=db_meeting.id,
                    vector=vector,
                    payload={
                        "id": db_meeting.id,
                        "owner_id": owner_id,
                        "investor_id": db_meeting.investor_id,
                        "note": extracted_summary
                    }
                )
        except Exception as e:
            print(f"Warning: Failed to index concise summary in Qdrant 'investor_notes': {e}")

        return db_meeting
