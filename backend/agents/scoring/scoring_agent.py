from sqlalchemy.orm import Session
from backend.services.score_service import ScoreService
from backend.services.meeting_service import MeetingService
from backend.services.memory_service import MemoryService
from backend.models.startup_profile import StartupProfile

class ScoringAgent:
    def run(self, retrieved_context: dict, db: Session, owner_id: int) -> dict:
        """
        Calculates matchmaking, priority, and readiness scores using ScoreService.
        """
        db_profile = db.query(StartupProfile).filter(StartupProfile.owner_id == owner_id).first()
        
        # 1. Enforce completeness check on minimal startup inputs
        missing_fields = []
        if not db_profile:
            missing_fields = ["industry", "stage", "amount_raising"]
        else:
            if not db_profile.industry or not db_profile.industry.strip():
                missing_fields.append("industry")
            if not db_profile.stage or not db_profile.stage.strip():
                missing_fields.append("stage")
            if db_profile.amount_raising is None or db_profile.amount_raising <= 0:
                missing_fields.append("amount_raising")

        if missing_fields:
            return {
                "score": None,
                "missing_fields": missing_fields,
                "scores": {
                    "match_score": None,
                    "priority_score": None,
                    "readiness_score": None
                }
            }

        # Transform database model to dict matching ScoreService expectations
        industries = [ind.strip() for ind in db_profile.industry.split(",")] if db_profile.industry else []
        startup_profile = {
            "industries": industries,
            "stage": db_profile.stage,
            "target_raise": db_profile.amount_raising,
            "has_deck": db_profile.has_deck or False,
            "has_financial_model": db_profile.has_financial_model or False,
            "has_cap_table": db_profile.has_cap_table or False,
            "has_one_pager": db_profile.has_one_pager or False,
            "has_legal_setup": db_profile.has_legal_setup or False
        }

        investor_info = retrieved_context.get("investor") if retrieved_context else None
        
        meetings_list = []
        memories_list = []
        followups_list = []

        if investor_info:
            investor_id = investor_info.get("id")
            
            meetings = MeetingService.get_all(
                db, owner_id=owner_id, investor_id=investor_id
            )
            meetings_list = [{"id": m.id, "date": str(m.date)} for m in meetings]
            
            memories = MemoryService.get_all(
                db, owner_id=owner_id, investor_id=investor_id
            )
            memories_list = [{"id": mem.id, "memory_type": mem.memory_type} for mem in memories]
            
            from backend.models.followup import FollowUp
            from backend.models.meeting import Meeting
            from backend.models.investor import Investor
            followups = (
                db.query(FollowUp)
                .join(Meeting)
                .join(Investor)
                .filter(
                    FollowUp.owner_id == owner_id,
                    Meeting.investor_id == investor_id,
                    Investor.owner_id == owner_id
                )
                .all()
            )
            followups_list = [{"id": f.id, "status": f.status} for f in followups]

        match_score = 0
        if investor_info:
            match_score = ScoreService.calculate_match_score(startup_profile, investor_info)
        
        priority_score = ScoreService.calculate_priority_score(meetings_list, memories_list, followups_list)
        readiness_score = ScoreService.calculate_readiness_score(startup_profile, memories_list)

        return {
            "scores": {
                "match_score": match_score,
                "priority_score": priority_score,
                "readiness_score": readiness_score
            }
        }
