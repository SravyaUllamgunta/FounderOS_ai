from sqlalchemy.orm import Session
from typing import List, Optional
from backend.models.investor import Investor
from backend.schemas.investor import InvestorCreate

class InvestorService:
    @staticmethod
    def get_all(db: Session, owner_id: int, limit: int = 100, offset: int = 0) -> List[Investor]:
        return (
            db.query(Investor)
            .filter(Investor.owner_id == owner_id)
            .offset(offset)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_by_id(db: Session, investor_id: str, owner_id: int) -> Optional[Investor]:
        return (
            db.query(Investor)
            .filter(Investor.id == investor_id, Investor.owner_id == owner_id)
            .first()
        )

    @staticmethod
    def get_by_name(db: Session, name: str, owner_id: int) -> Optional[Investor]:
        """Performs fuzzy matching by investor name."""
        return (
            db.query(Investor)
            .filter(
                Investor.owner_id == owner_id,
                Investor.name.ilike(f"%{name}%")
            )
            .first()
        )

    @staticmethod
    def create(db: Session, investor_in: InvestorCreate, owner_id: int) -> Investor:
        db_investor = Investor(
            owner_id=owner_id,
            name=investor_in.name,
            firm=investor_in.firm,
            role=investor_in.role,
            status=investor_in.status,
            location=investor_in.location,
            typical_check=investor_in.typical_check,
            focus=investor_in.focus,
            stage=investor_in.stage,
            preferences=investor_in.preferences or {},
            notes=investor_in.notes,
            interest_score=investor_in.interest_score,
        )
        db.add(db_investor)
        db.commit()
        db.refresh(db_investor)
        return db_investor
