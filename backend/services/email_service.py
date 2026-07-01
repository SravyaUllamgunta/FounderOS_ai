from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.db import Email

class EmailService:
    @staticmethod
    def get_by_investor(db: Session, investor_id: str, owner_id: int) -> List[Email]:
        return (
            db.query(Email)
            .filter(
                Email.investor_id == investor_id,
                Email.owner_id == owner_id
            )
            .all()
        )

    @staticmethod
    def get_draft_count(db: Session, investor_ids: List[str], owner_id: int) -> int:
        if not investor_ids:
            return 0
        return (
            db.query(Email)
            .filter(
                Email.investor_id.in_(investor_ids),
                Email.status == "draft",
                Email.owner_id == owner_id
            )
            .count()
        )

    @staticmethod
    def create(db: Session, investor_id: str, subject: str, body: str, tone: str, type_: str, owner_id: int) -> Email:
        email = Email(
            investor_id=investor_id,
            owner_id=owner_id,
            subject=subject,
            body=body,
            tone=tone,
            type=type_,
            status="draft"
        )
        db.add(email)
        db.commit()
        db.refresh(email)
        return email
