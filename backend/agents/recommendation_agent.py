import logging
from typing import List, Optional
from pydantic import BaseModel, Field
from backend.agents.gemini_client import generate_structured_output

logger = logging.getLogger("recommendation_agent")

class RecommendationOutput(BaseModel):
    next_best_actions: List[str] = Field(..., description="List of recommended action items, next steps, or strategies")
    priority: str = Field(..., description="Priority level of the actions (High, Medium, or Low)")
    reason: str = Field(..., description="Strategic reasoning for these next best actions based on context")
    deadline: str = Field(..., description="Recommended deadline or timeframe for completing these actions")

def rule_based_recommend(meeting_summary: str, memory: str) -> RecommendationOutput:
    """
    Produces dynamic next best actions by scanning context keywords when LLM quota is exhausted.
    """
    logger.info("Executing rule-based local recommendation generator fallback.")
    actions = []
    reason = "Dynamic recommendation based on conversation context."
    priority = "Medium"
    
    text = f"{meeting_summary} {memory}".lower()
    
    if "deck" in text or "presentation" in text:
        actions.append("Share the updated fundraising pitch deck addressing the team slide.")
    if "financial" in text or "model" in text or "numbers" in text or "metrics" in text:
        actions.append("Send the revised 3-year financial model with the sensitivity analysis spreadsheet.")
    if "cap table" in text or "equity" in text or "dilution" in text:
        actions.append("Upload and share the cap table reflecting the current employee option pool.")
    if "legal" in text or "incorporation" in text or "safe" in text or "term" in text:
        actions.append("Coordinate legal setup review with your corporate counsel and share draft SAFE terms.")
    if "schedule" in text or "call" in text or "meeting" in text or "follow up" in text:
        actions.append("Follow up to schedule the next technical deep-dive call with the investment partners.")
        
    if not actions:
        actions = [
            "Follow up with the investor to share the requested product roadmap slides.",
            "Prepare team background summaries and customer reference case studies."
        ]
        priority = "Medium"
        reason = "Inspecting meeting summary details. Recommended general follow-up actions."
    else:
        priority = "High"
        reason = f"Identified deliverables discussed: {', '.join(actions)}."
        
    return RecommendationOutput(
        next_best_actions=actions,
        priority=priority,
        reason=reason,
        deadline="Within 48 hours"
    )

SYSTEM_INSTRUCTION = """You are FounderOS's Recommendation Agent.

Generate recommendations ONLY using:
1. User supplied information
2. Retrieved context

Never invent:
- investors
- meetings
- startup metrics
- fundraising details.

If information is insufficient,
explain what information is missing.
"""

PROMPT_TEMPLATE = """
Please analyze the following inputs and generate the next best actions:

Investor Profile:
{investor_profile}

Recent Meeting Summary:
{meeting_summary}

Relationship Memory / Context:
{memory}

Past Meetings History:
{past_meetings}
"""

def generate_recommendations(
    investor_profile: str,
    meeting_summary: str,
    memory: str,
    past_meetings: str
) -> RecommendationOutput:
    """
    Invokes Gemini to generate recommendations for next best actions.
    """
    if not meeting_summary or not meeting_summary.strip():
        logger.warning("Empty meeting summary provided. Returning fallback recommendation.")
        return rule_based_recommend("", "")
        
    prompt = PROMPT_TEMPLATE.format(
        investor_profile=investor_profile or "Not available",
        meeting_summary=meeting_summary,
        memory=memory or "None",
        past_meetings=past_meetings or "None"
    )
    
    fallback = rule_based_recommend(meeting_summary, memory)
    return generate_structured_output(
        prompt=prompt,
        response_schema=RecommendationOutput,
        system_instruction=SYSTEM_INSTRUCTION,
        mock_fallback_data=fallback
    )

def run_recommendation_node(state: dict) -> dict:
    """
    LangGraph node for generating next best recommendations.
    """
    investor_profile = state.get("investor_profile", "")
    meeting_summary = state.get("meeting_summary", "")
    if not meeting_summary and "extracted_meeting_data" in state:
        meeting_summary = state["extracted_meeting_data"].get("summary", "")
        
    memory = state.get("memory", "")
    past_meetings = state.get("past_meetings", "")
    
    recommendation = generate_recommendations(
        investor_profile=investor_profile,
        meeting_summary=meeting_summary,
        memory=memory,
        past_meetings=past_meetings
    )
    
    return {
        **state,
        "recommendation_data": recommendation.model_dump()
    }
