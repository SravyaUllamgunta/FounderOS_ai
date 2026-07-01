from pydantic import BaseModel
from datetime import datetime

class MemoryBase(BaseModel):
    investor_id: str
    memory: str
    memory_type: str  # preference, concern, meeting_note, action_item, relationship_note

class MemoryCreate(MemoryBase):
    pass

class MemoryUpdate(BaseModel):
    memory: str

class MemoryResponse(MemoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
