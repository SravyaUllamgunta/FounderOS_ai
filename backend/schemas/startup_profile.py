from pydantic import BaseModel
from typing import Optional, List

class StartupProfileBase(BaseModel):
    industry: Optional[str] = ""
    stage: Optional[str] = ""
    amount_raising: Optional[float] = 0.0
    team_size: Optional[int] = 0
    arr: Optional[float] = 0.0
    description: Optional[str] = ""
    has_deck: Optional[bool] = False
    has_financial_model: Optional[bool] = False
    has_cap_table: Optional[bool] = False
    has_one_pager: Optional[bool] = False
    has_legal_setup: Optional[bool] = False

class StartupProfileCreate(StartupProfileBase):
    pass

class StartupProfileUpdate(StartupProfileBase):
    pass

class StartupProfileResponse(StartupProfileBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True

class StartupProfileCompletionResponse(BaseModel):
    completion_percentage: int
    missing_fields: List[str]
