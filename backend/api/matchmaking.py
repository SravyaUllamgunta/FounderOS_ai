from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.database.session import get_db
from backend.services.auth_service import get_current_user
from backend.models.user import User
from backend.models.investor import Investor
from backend.services.score_service import ScoreService
from pydantic import BaseModel

router = APIRouter(prefix="/matchmaking", tags=["Matchmaking"])

class StartupProfileSchema(BaseModel):
    industries: List[str]
    stage: str
    target_raise: float

class MatchResult(BaseModel):
    investor_id: str
    name: str
    firm: str
    match_score: int
    role: str = "Investor"
    location: str = ""
    typical_check: str = ""
    focus: Optional[List[str]] = None
    stage: Optional[str] = None
    notes: str = ""

@router.post("", response_model=List[MatchResult])
def get_matchmaking(
    profile: StartupProfileSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # A founder can only rank investors belonging to their own tenant.
    investors = db.query(Investor).filter(Investor.owner_id == current_user.id).all()
    
    results = []
    startup_dict = profile.model_dump()
    
    for inv in investors:
        inv_dict = {
            "name": inv.name,
            "firm": inv.firm,
            "focus": inv.focus,
            "stage": inv.stage,
            "preferences": inv.preferences
        }
        score = ScoreService.calculate_match_score(startup_dict, inv_dict)
        results.append({
            "investor_id": inv.id,
            "name": inv.name,
            "firm": inv.firm,
            "match_score": score,
            "role": inv.role or "Investor",
            "location": inv.location or "",
            "typical_check": inv.typical_check or "",
            "focus": inv.focus,
            "stage": inv.stage or "",
            "notes": inv.notes or ""
        })
        
    # Sort descending by match_score
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results
