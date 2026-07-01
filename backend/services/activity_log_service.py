from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.db import ActivityLog

class ActivityLogService:
    @staticmethod
    def get_recent(db: Session, owner_id: int, limit: int = 10) -> List[ActivityLog]:
        return (
            db.query(ActivityLog)
            .filter(ActivityLog.owner_id == owner_id)
            .order_by(ActivityLog.created_at.desc())
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_by_investor(db: Session, investor_id: str, owner_id: int) -> List[ActivityLog]:
        return (
            db.query(ActivityLog)
            .filter(
                ActivityLog.investor_id == investor_id,
                ActivityLog.owner_id == owner_id
            )
            .order_by(ActivityLog.created_at.desc())
            .all()
        )

    @staticmethod
    def create(
        db: Session,
        investor_id: str,
        type_: str,
        title: str,
        date: str,
        description: str,
        author: str,
        tags: list,
        owner_id: int
    ) -> ActivityLog:
        log = ActivityLog(
            investor_id=investor_id,
            owner_id=owner_id,
            type=type_,
            title=title,
            date=date,
            description=description,
            author=author,
            tags=tags
        )
        db.add(log)
        return log
