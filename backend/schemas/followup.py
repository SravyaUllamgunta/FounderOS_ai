from pydantic import BaseModel

class FollowUpBase(BaseModel):
    meeting_id: str
    email: str
    status: str = "pending"

class FollowUpCreate(FollowUpBase):
    pass

class FollowUpResponse(FollowUpBase):
    id: int

    class Config:
        from_attributes = True
