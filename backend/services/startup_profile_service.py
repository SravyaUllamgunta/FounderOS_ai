from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from backend.models.startup_profile import StartupProfile
from backend.schemas.startup_profile import StartupProfileCreate, StartupProfileUpdate

class StartupProfileService:
    @staticmethod
    def get_by_owner(db: Session, owner_id: int) -> Optional[StartupProfile]:
        return db.query(StartupProfile).filter(StartupProfile.owner_id == owner_id).first()

    @staticmethod
    def create_or_update(db: Session, owner_id: int, profile_in: StartupProfileCreate) -> StartupProfile:
        db_profile = StartupProfileService.get_by_owner(db, owner_id)
        if not db_profile:
            db_profile = StartupProfile(
                owner_id=owner_id,
                industry=profile_in.industry,
                stage=profile_in.stage,
                amount_raising=profile_in.amount_raising,
                team_size=profile_in.team_size,
                arr=profile_in.arr,
                description=profile_in.description,
                has_deck=profile_in.has_deck or False,
                has_financial_model=profile_in.has_financial_model or False,
                has_cap_table=profile_in.has_cap_table or False,
                has_one_pager=profile_in.has_one_pager or False,
                has_legal_setup=profile_in.has_legal_setup or False
            )
            db.add(db_profile)
        else:
            db_profile.industry = profile_in.industry
            db_profile.stage = profile_in.stage
            db_profile.amount_raising = profile_in.amount_raising
            db_profile.team_size = profile_in.team_size
            db_profile.arr = profile_in.arr
            db_profile.description = profile_in.description
            db_profile.has_deck = profile_in.has_deck if profile_in.has_deck is not None else db_profile.has_deck
            db_profile.has_financial_model = profile_in.has_financial_model if profile_in.has_financial_model is not None else db_profile.has_financial_model
            db_profile.has_cap_table = profile_in.has_cap_table if profile_in.has_cap_table is not None else db_profile.has_cap_table
            db_profile.has_one_pager = profile_in.has_one_pager if profile_in.has_one_pager is not None else db_profile.has_one_pager
            db_profile.has_legal_setup = profile_in.has_legal_setup if profile_in.has_legal_setup is not None else db_profile.has_legal_setup
            
        db.commit()
        db.refresh(db_profile)
        return db_profile

    @staticmethod
    def get_completion(db: Session, owner_id: int) -> Dict[str, Any]:
        profile = StartupProfileService.get_by_owner(db, owner_id)
        fields_to_check = {
            "industry": "Industry",
            "stage": "Funding Stage",
            "amount_raising": "Target Raise Amount",
            "team_size": "Team Size",
            "arr": "Annual Recurring Revenue (ARR)",
            "description": "Company Description"
        }
        
        if not profile:
            return {
                "completion_percentage": 0,
                "missing_fields": list(fields_to_check.values())
            }
            
        missing_fields = []
        filled_count = 0
        
        for field, label in fields_to_check.items():
            val = getattr(profile, field)
            # Consider field missing if it is None, empty string, or 0 (since early stage might have 0 ARR, but let's check values)
            # ARR or team_size can be 0. Let's say if None or empty string:
            if val is None or (isinstance(val, str) and not val.strip()):
                missing_fields.append(label)
            elif field in ["amount_raising", "team_size", "arr"] and val <= 0:
                missing_fields.append(label)
            else:
                filled_count += 1
                
        pct = int((filled_count / len(fields_to_check)) * 100)
        return {
            "completion_percentage": pct,
            "missing_fields": missing_fields
        }
