from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.services.auth_service import get_current_user
from backend.models.user import User
from backend.graphs.founder_graph import get_graph
from backend.tools.qdrant_tool import QdrantTool
from backend.schemas.planner import PlannerRequest

router = APIRouter(prefix="/orchestrate", tags=["Orchestration"])

@router.post("")
def orchestrate_query(
    payload: PlannerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Executes the LangGraph orchestrator workflow dynamically based on the PlannerRequest.
    """
    qdrant = QdrantTool()
    graph = get_graph()
    
    # Assemble initial graph state
    initial_state = {
        "action": payload.action,
        "query": payload.query,
        "payload": payload.payload or {},
        "owner_id": current_user.id,
        "db": db,
        "qdrant": qdrant,
        "current_index": 0,
        "workflow": [],
        "collections": [],
        "extracted_data": {},
        "extracted_meeting_data": {},
        "recommendation_data": {},
        "memories": [],
        "notes": [],
        "transcripts": [],
        "scores": {},
        "recommendations": [],
        "explanation": "",
        "communication": {},
        "communication_type": "Follow-up Email",
        "communication_tone": "Professional",
        "metadata": {
            "user_id": current_user.id,
            "owner_id": current_user.id,
            "current_page": "dashboard"
        },
        "errors": []
    }
    
    # Invoke orchestrator
    result = graph.invoke(initial_state)
    
    # Exclude non-serializable properties (like SQLAlchemy Session or Qdrant client) before returning
    serializable_result = {}
    for key, val in result.items():
        if key not in ["db", "qdrant", "owner_id"]:
            serializable_result[key] = val
            
    return serializable_result
