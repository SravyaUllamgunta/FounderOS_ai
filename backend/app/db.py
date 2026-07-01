"""Canonical SQLAlchemy models shared by APIs, services, and agents.

This module intentionally contains no demo seeding. A new founder starts with an
empty workspace and only sees rows owned by their authenticated user.
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, Text, Float
from sqlalchemy.orm import relationship

from backend.database.base import Base
from backend.database.session import SessionLocal, engine


def new_id(prefix: str) -> str:
    # Qdrant accepts UUID point IDs, so the same identifier can safely be used
    # across PostgreSQL and vector collections.
    return str(uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="Founder", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    investors = relationship("Investor", back_populates="owner", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="owner", cascade="all, delete-orphan")


class Investor(Base):
    __tablename__ = "investors"

    id = Column(String, primary_key=True, index=True, default=lambda: new_id("inv"))
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    firm = Column(String, nullable=False)
    role = Column(String, default="Investor", nullable=False)
    status = Column(String, default="Pipeline Lead", nullable=False)
    last_contact = Column(String, default="Not contacted", nullable=False)
    location = Column(String, default="", nullable=False)
    typical_check = Column(String, default="", nullable=False)
    preferences = Column(JSON, default=dict, nullable=False)
    focus = Column(JSON, default=list, nullable=False)
    stage = Column(String, default="", nullable=False)
    notes = Column(Text, default="", nullable=False)
    interest_score = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="investors")
    meetings = relationship("Meeting", back_populates="investor", cascade="all, delete-orphan")
    memories = relationship("Memory", back_populates="investor", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="investor", cascade="all, delete-orphan")
    db_notes = relationship("Note", back_populates="investor", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="investor", cascade="all, delete-orphan")
    emails = relationship("Email", back_populates="investor", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="investor", cascade="all, delete-orphan")


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String, primary_key=True, index=True, default=lambda: new_id("meet"))
    investor_id = Column(String, ForeignKey("investors.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(String, nullable=False)
    duration = Column(String, default="", nullable=False)
    summary = Column(Text, default="", nullable=False)
    transcript = Column(Text, default="", nullable=False)
    sentiment = Column(String, default="", nullable=False)
    interest_level = Column(String, default="", nullable=False)
    interest_score = Column(Integer, default=0, nullable=False)
    concerns = Column(JSON, default=list, nullable=False)
    questions = Column(JSON, default=list, nullable=False)
    next_steps = Column(JSON, default=list, nullable=False)
    action_items = Column(JSON, default=list, nullable=False)
    follow_up_date = Column(String, default="", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    investor = relationship("Investor", back_populates="meetings")
    followups = relationship("FollowUp", back_populates="meeting", cascade="all, delete-orphan")

    @property
    def transcript_text(self):
        return self.transcript


class Memory(Base):
    __tablename__ = "memories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    investor_id = Column(String, ForeignKey("investors.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    memory = Column(Text, nullable=False)
    memory_type = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    investor = relationship("Investor", back_populates="memories")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String, primary_key=True, index=True, default=lambda: new_id("rec"))
    investor_id = Column(String, ForeignKey("investors.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(Text, default="", nullable=False)
    next_best_actions = Column(JSON, default=list, nullable=False)
    priority = Column(String, default="Medium", nullable=False)
    reason = Column(Text, default="", nullable=False)
    status = Column(String, default="pending", nullable=False)
    deadline = Column(String, default="", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    investor = relationship("Investor", back_populates="recommendations")


class FollowUp(Base):
    __tablename__ = "followups"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    meeting_id = Column(String, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(Text, nullable=False)
    status = Column(String, default="pending", nullable=False)

    meeting = relationship("Meeting", back_populates="followups")


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    investor_id = Column(String, ForeignKey("investors.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    investor = relationship("Investor", back_populates="db_notes")


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    investor_id = Column(String, ForeignKey("investors.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    due_date = Column(String, nullable=False)
    status = Column(String, default="pending", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    investor = relationship("Investor", back_populates="reminders")


class Email(Base):
    __tablename__ = "emails"

    id = Column(String, primary_key=True, index=True, default=lambda: new_id("email"))
    investor_id = Column(String, ForeignKey("investors.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    tone = Column(String, default="Professional", nullable=False)
    type = Column(String, default="Follow-up Email", nullable=False)
    status = Column(String, default="draft", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    investor = relationship("Investor", back_populates="emails")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String, primary_key=True, index=True, default=lambda: new_id("activity"))
    investor_id = Column(String, ForeignKey("investors.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    date = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    author = Column(String, nullable=False)
    tags = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    investor = relationship("Investor", back_populates="activity_logs")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    link = Column(String, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="notifications")


class StartupProfile(Base):
    __tablename__ = "startup_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    industry = Column(String, default="", nullable=True)
    stage = Column(String, default="", nullable=True)
    amount_raising = Column(Float, default=0.0, nullable=True)
    team_size = Column(Integer, default=0, nullable=True)
    arr = Column(Float, default=0.0, nullable=True)
    description = Column(Text, default="", nullable=True)

    # Checklist booleans
    has_deck = Column(Boolean, default=False, nullable=False)
    has_financial_model = Column(Boolean, default=False, nullable=False)
    has_cap_table = Column(Boolean, default=False, nullable=False)
    has_one_pager = Column(Boolean, default=False, nullable=False)
    has_legal_setup = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("User")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_database():
    """Kept for backwards compatibility; production data is never auto-seeded."""
    return None


__all__ = [
    "Base", "engine", "SessionLocal", "get_db", "seed_database", "User",
    "Investor", "Meeting", "Memory", "Recommendation", "FollowUp", "Note",
    "Reminder", "Email", "ActivityLog", "Notification", "StartupProfile",
]

