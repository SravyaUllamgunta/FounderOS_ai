from typing import Dict, Any, List, TypedDict

class FounderGraphState(TypedDict, total=False):
    # Core Phase 1 Fields
    action: str
    query: str
    payload: Dict[str, Any]
    context: Dict[str, Any]
    results: Dict[str, Any]
    metadata: Dict[str, Any]  # user_id, owner_id, meeting_id, investor_id, current_page
    errors: List[str]  # graceful agent failure tracking

    # Compatibility Fields
    current_index: int
    workflow: List[str]
    collections: List[str]
    extracted_data: Dict[str, Any]
    extracted_meeting_data: Dict[str, Any]
    recommendation_data: Dict[str, Any]
    memories: List[Dict[str, Any]]
    notes: List[Dict[str, Any]]
    transcripts: List[Dict[str, Any]]
    scores: Dict[str, Any]
    recommendations: List[Dict[str, Any]]
    explanation: str
    communication: Dict[str, Any]
    communication_type: str
    communication_tone: str
