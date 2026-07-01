from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.db import Notification

class NotificationService:
    @staticmethod
    def get_all(db: Session, owner_id: int) -> List[Notification]:
        return (
            db.query(Notification)
            .filter(Notification.owner_id == owner_id)
            .order_by(Notification.created_at.desc())
            .all()
        )

    @staticmethod
    def get_by_id(db: Session, notification_id: int, owner_id: int) -> Optional[Notification]:
        return (
            db.query(Notification)
            .filter(
                Notification.id == notification_id,
                Notification.owner_id == owner_id
            )
            .first()
        )
