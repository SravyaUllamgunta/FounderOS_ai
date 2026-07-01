from typing import List, Optional
from pydantic import BaseModel

class CommunicationRequest(BaseModel):
    investor_name: str
    communication_type: str
    tone: str
    meeting_context: str = ""
    founder_message: str = ""
    attachments: List[str] = []
    additional_instructions: str = ""
