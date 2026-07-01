from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.db import Recommendation

class RecommendationService:
    @staticmethod
    def get_by_investor(db: Session, investor_id: str, owner_id: int) -> List[Recommendation]:
        return (
            db.query(Recommendation)
            .filter(
                Recommendation.investor_id == investor_id,
                Recommendation.owner_id == owner_id
            )
            .all()
        )

    @staticmethod
    def get_pending(db: Session, owner_id: int) -> List[Recommendation]:
        return (
            db.query(Recommendation)
            .filter(
                Recommendation.owner_id == owner_id,
                Recommendation.status == "pending"
            )
            .all()
        )
