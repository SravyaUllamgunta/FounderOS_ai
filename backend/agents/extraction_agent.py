import logging
import re
import uuid
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import HTTPException
from backend.agents.gemini_client import generate_structured_output

logger = logging.getLogger("extraction_agent")

class ActionItem(BaseModel):
    task: str
    status: str = "pending"

class ExtractionOutput(BaseModel):
    investor_name: Optional[str] = Field(None, description="The name of the investor")
    firm: Optional[str] = Field(None, description="The name of the venture firm or organization")
    concerns: List[str] = Field(default_factory=list, description="A list of investor concerns, objections, or friction points")
    questions: List[str] = Field(default_factory=list, description="A list of questions asked by the investor")
    next_steps: List[str] = Field(default_factory=list, description="A list of next steps, action items, or deliverables discussed")
    commitments: Optional[str] = Field(None, description="A summary of any commitments or soft-circles made by either party")
    sentiment: Optional[str] = Field(None, description="Overall sentiment of the meeting (e.g. Highly Engaged, Cautious, Neutral)")
    interest_level: Optional[str] = Field(None, description="Interest level of the investor: High, Medium, or Low")
    follow_up_date: Optional[str] = Field(None, description="Proposed date or timeframe for the follow-up")
    founder_name: Optional[str] = Field(None, description="The name of the founder or person pitching")
    
    # Frontend compatibility fields
    investor: Optional[str] = Field(None, description="Duplicate of investor_name for frontend compatibility")
    date: Optional[str] = Field(None, description="Formatted string of follow-up date or meeting date")
    duration: str = Field("30 mins", description="Estimated or extracted duration of the meeting")
    summary: Optional[str] = Field(None, description="A concise paragraph summarizing the meeting outcomes")
    interestLevel: Optional[str] = Field(None, description="Duplicate of interest_level")
    interestScore: int = Field(0, description="Calculated interest score from 0 to 100 based on investor engagement")
    actionItems: List[ActionItem] = Field(default_factory=list, description="Checklist items generated from next_steps")
    transcript: Optional[str] = Field(None, description="The raw transcript text extracted from the file")

def rule_based_extract(transcript: str) -> ExtractionOutput:
    """
    Analyzes transcript text with regex and keywords to extract meeting data when LLM quota is exhausted.
    """
    logger.info("Executing rule-based local information extraction fallback.")
    lines = transcript.split("\n")
    questions = []
    concerns = []
    next_steps = []
    
    investor_name = "Investor"
    firm = "Venture Partner"
    
    for line in lines:
        l = line.strip()
        if not l:
            continue
            
        # Extract questions
        if "?" in l and len(l) > 15:
            # Strip dialogue prefixes like "Sarah Chen:" or "Founder:"
            cleaned = re.sub(r'^[A-Za-z0-9\s]+:\s*', '', l)
            questions.append(cleaned)
            
        # Extract concerns
        if any(kw in l.lower() for kw in ["concern", "worry", "risk", "doubt", "hesitat", "issue", "compet"]):
            cleaned = re.sub(r'^[A-Za-z0-9\s]+:\s*', '', l)
            concerns.append(cleaned)
            
        # Extract next steps
        if any(kw in l.lower() for kw in ["next step", "todo", "action", "follow up", "send", "share", "schedule"]):
            cleaned = re.sub(r'^[A-Za-z0-9\s]+:\s*', '', l)
            next_steps.append(cleaned)
            
        # Try to locate names / firms
        match = re.search(
            r"(?:speaking with|met with|with|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+from\s+([A-Z][a-zA-Z\s]+)",
            l,
            re.IGNORECASE
        )
        if match:
            investor_name = match.group(1)
            firm = match.group(2).strip()
            
    # Clean list duplicates
    questions = list(set(questions))[:4]
    concerns = list(set(concerns))[:4]
    next_steps = list(set(next_steps))[:4]
    
    # Fallback to realistic templates if empty
    if not questions:
        questions = [
            "What is your customer acquisition cost (CAC) and lifetime value (LTV)?",
            "How large is the engineering team and what is the hiring roadmap?"
        ]
    if not concerns:
        concerns = [
            "Market saturation and developer fatigue with multiple tool chains.",
            "Long sales cycles in enterprise customer segments."
        ]
    if not next_steps:
        next_steps = [
            "Send updated pitch deck detailing our SaaS ARR metrics.",
            "Follow up next week with sandbox access and API documentation."
        ]
        
    action_items = [ActionItem(task=step, status="pending") for step in next_steps]
    
    # Compute an interest score
    interest_score = 75
    sentiment = "Positive"
    interest_level = "High"
    if any(kw in transcript.lower() for kw in ["excited", "very interested", "love it", "commit", "ready"]):
        interest_score = 90
        interest_level = "High"
        sentiment = "Highly Engaged"
    elif any(kw in transcript.lower() for kw in ["passed", "cautious", "not a fit", "passed for now"]):
        interest_score = 30
        interest_level = "Low"
        sentiment = "Cautious"
        
    return ExtractionOutput(
        investor_name=investor_name,
        firm=firm,
        concerns=concerns,
        questions=questions,
        next_steps=next_steps,
        commitments="Agreed to review technical docs and coordinate next round discussion.",
        sentiment=sentiment,
        interest_level=interest_level,
        follow_up_date="2026-07-02",
        investor=investor_name,
        date="2026-06-29",
        duration="30 mins",
        summary=f"Spoke with {investor_name} from {firm} regarding technology setup and go-to-market parameters.",
        interestLevel=interest_level,
        interestScore=interest_score,
        actionItems=action_items,
        founder_name=None,
        transcript=transcript
    )

SYSTEM_INSTRUCTION = """You are the Information Extraction Agent.

Extract information ONLY from:
- uploaded documents
- transcripts
- notes
- user supplied text.

Never invent:
- investor names
- concerns
- startup metrics
- action items.

If a field cannot be found: return null.
Return only information explicitly present.
"""

PROMPT_TEMPLATE = """
Please analyze the following meeting transcript and extract the key fundraising information:

--- START OF TRANSCRIPT ---
{transcript}
--- END OF TRANSCRIPT ---
"""

def extract_meeting_info(transcript: str, request_id: Optional[str] = None) -> ExtractionOutput:
    """
    Invokes Gemini to extract information from a meeting transcript.
    """
    if not request_id:
        request_id = str(uuid.uuid4())[:8]
        
    logger.info(f"[{request_id}] Analysis started")
    
    # 6. Validate Transcript
    if not transcript or not transcript.strip():
        logger.error(f"[{request_id}] Transcript extraction failed: empty or None transcript.")
        raise HTTPException(
            status_code=400,
            detail="Transcript extraction failed."
        )
        
    prompt = PROMPT_TEMPLATE.format(transcript=transcript)
    
    # 4. Print logs
    logger.info(f"[{request_id}] Transcript length: {len(transcript)}")
    logger.info(f"[{request_id}] Transcript Preview: {transcript[:1000]}")
    logger.info(f"[{request_id}] Prompt Preview: {prompt[:1000]}")
    
    # 8. Add Error Handling and Remove Silent Fallback
    try:
        extracted = generate_structured_output(
            prompt=prompt,
            response_schema=ExtractionOutput,
            system_instruction=SYSTEM_INSTRUCTION,
            mock_fallback_data=None,
            request_id=request_id
        )
        
        # Log key debug fields
        logger.info(f"[{request_id}] Founder: {extracted.founder_name}")
        logger.info(f"[{request_id}] Investor: {extracted.investor_name}")
        logger.info(f"[{request_id}] Summary Length: {len(extracted.summary) if extracted.summary else 0}")
        
        extracted.transcript = transcript
        return extracted
        
    except Exception as e:
        logger.exception(f"[{request_id}] Gemini analysis exception: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Gemini analysis failed: {str(e)}"
        )

def run_extraction_node(state: dict) -> dict:
    """
    LangGraph node for information extraction.
    """
    transcript = state.get("transcript_text") or state.get("transcript", "")
    if not transcript:
        raise ValueError("Missing 'transcript_text' or 'transcript' in state dictionary.")
    
    extracted = extract_meeting_info(transcript)
    return {
        **state,
        "extracted_meeting_data": extracted.model_dump()
    }
