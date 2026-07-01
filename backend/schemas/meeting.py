from pydantic import BaseModel
from typing import Optional

class MeetingBase(BaseModel):
    investor_id: str
    transcript: Optional[str] = None
    summary: Optional[str] = None
    date: str

class MeetingCreate(MeetingBase):
    pass

class MeetingResponse(MeetingBase):
    id: str

    class Config:
        from_attributes = True
