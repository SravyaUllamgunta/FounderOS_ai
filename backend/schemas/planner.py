from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class PlannerAction(str, Enum):
    DASHBOARD_LOAD = "DASHBOARD_LOAD"
    INVESTOR_PRIORITIZATION = "INVESTOR_PRIORITIZATION"
    MEETING_ANALYSIS = "MEETING_ANALYSIS"
    GENERATE_FOLLOWUP = "GENERATE_FOLLOWUP"
    RELATIONSHIP_SUMMARY = "RELATIONSHIP_SUMMARY"
    CHAT_QUERY = "CHAT_QUERY"
    STARTUP_PROFILE_UPDATE = "STARTUP_PROFILE_UPDATE"

class InvestorSource(str, Enum):
    EXISTING = "existing"
    UPLOAD = "upload"
    BOTH = "both"

class PlannerRequest(BaseModel):
    action: PlannerAction = PlannerAction.CHAT_QUERY
    query: str = ""
    payload: Dict[str, Any] = {}

class PlannerResponse(BaseModel):
    status: str  # success, partial, failed
    workflow: List[str]
    collections: List[str]
    needs_retrieval: bool
    requires_approval: bool
    explanation: str
