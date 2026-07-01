from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.db import Reminder

class ReminderService:
    @staticmethod
    def get_by_investor(db: Session, investor_id: str, owner_id: int) -> List[Reminder]:
        return (
            db.query(Reminder)
            .filter(
                Reminder.investor_id == investor_id,
                Reminder.owner_id == owner_id
            )
            .all()
        )

    @staticmethod
    def create(db: Session, investor_id: str, title: str, due_date: str, owner_id: int) -> Reminder:
        reminder = Reminder(
            investor_id=investor_id,
            owner_id=owner_id,
            title=title,
            due_date=due_date
        )
        db.add(reminder)
        db.commit()
        db.refresh(reminder)
        return reminder
