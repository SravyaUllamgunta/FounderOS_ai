from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.services.auth_service import get_current_user
from backend.models.user import User
from backend.schemas.startup_profile import StartupProfileCreate, StartupProfileResponse, StartupProfileCompletionResponse
from backend.services.startup_profile_service import StartupProfileService

router = APIRouter(prefix="/startup_profile", tags=["Startup Profile"])

@router.get("", response_model=StartupProfileResponse)
def get_startup_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = StartupProfileService.get_by_owner(db, owner_id=current_user.id)
    if not profile:
        # Return a blank profile object for this owner
        return StartupProfileService.create_or_update(db, current_user.id, StartupProfileCreate())
    return profile

@router.post("", response_model=StartupProfileResponse)
def save_startup_profile(profile_in: StartupProfileCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return StartupProfileService.create_or_update(db, current_user.id, profile_in)

@router.get("/completion", response_model=StartupProfileCompletionResponse)
def get_completion_status(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return StartupProfileService.get_completion(db, current_user.id)
