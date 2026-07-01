from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class DashboardSummary(BaseModel):
    active_investors: int
    soft_committed: int
    upcoming_meetings: int
    pending_followups: int


class DashboardChecklistItem(BaseModel):
    name: str
    status: str
    details: str


class DashboardActivityResponse(BaseModel):
    id: str
    type: str
    title: str
    description: str
    date: str
    investor_name: str = ""


class DashboardFollowUpResponse(BaseModel):
    id: int
    meeting_id: str
    investor_id: str
    investor_name: str
    investor_firm: str
    email: str
    status: str
    context: str = ""
    days_since: int = 0

    class Config:
        from_attributes = True


class DashboardMeetingResponse(BaseModel):
    id: str
    investor_id: str
    investor_name: str
    investor_firm: str
    date: str
    summary: str
    sentiment: Optional[str] = ""
    interest_level: Optional[str] = ""

    class Config:
        from_attributes = True


class DashboardRecommendationResponse(BaseModel):
    id: str
    investor_id: str
    investor_name: str
    investor_firm: str
    action: str
    reason: str
    status: str
    priority: str

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    summary: DashboardSummary
    scores: Dict[str, Any]
    checklist: List[DashboardChecklistItem]
    pending_actions: List[DashboardRecommendationResponse]
    upcoming_meetings: List[DashboardMeetingResponse]
    pending_followups: List[DashboardFollowUpResponse]
    recent_activity: List[DashboardActivityResponse]
    completion_percentage: int = 100
    missing_fields: List[str] = []

