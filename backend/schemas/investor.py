from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Union

class InvestorBase(BaseModel):
    name: str
    firm: str
    role: str = "Investor"
    status: str = "Pipeline Lead"
    location: str = ""
    typical_check: str = ""
    focus: Optional[List[str]] = None
    stage: Optional[str] = None
    preferences: Optional[Union[Dict[str, Any], List[str]]] = None
    notes: str = ""
    interest_score: int = 0

class InvestorCreate(InvestorBase):
    pass

class InvestorResponse(InvestorBase):
    id: str

    class Config:
        from_attributes = True
