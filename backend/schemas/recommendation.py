from pydantic import BaseModel

class RecommendationBase(BaseModel):
    investor_id: str
    action: str
    reason: str
    status: str = "pending"

class RecommendationCreate(RecommendationBase):
    pass

class RecommendationResponse(RecommendationBase):
    id: str

    class Config:
        from_attributes = True
