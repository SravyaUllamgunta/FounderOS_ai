import logging
from typing import Optional
from pydantic import BaseModel, Field
from backend.agents.gemini_client import generate_structured_output

logger = logging.getLogger("explanation_agent")

class ExplanationOutput(BaseModel):
    explanation: str = Field(..., description="A concise, UI-friendly explanation linking the recommendation, investor memory, and past meeting history.")

def rule_based_explain(recommendation: str, investor_memory: str, meeting_history: str) -> ExplanationOutput:
    """
    Generates structured match explanations based on context keys when LLM quota is exhausted.
    """
    logger.info("Executing rule-based local explanation generator fallback.")
    explanation = "Match Explanation: This investor is a strong match for your vertical focus. "
    if "deck" in recommendation.lower():
        explanation += "We recommend sharing your updated pitch deck to fulfill the outstanding follow-up from your last call. "
    if "model" in recommendation.lower() or "financial" in recommendation.lower():
        explanation += "Providing your 3-year financial model helps answer key questions regarding unit economics and ARR projections. "
    if investor_memory and investor_memory != "No past memories logged.":
        explanation += f"Relationship memory notes: '{investor_memory[:100]}...' "
        
    explanation += "Addressing these action items immediately signals high operational efficiency and fundraising readiness."
    return ExplanationOutput(explanation=explanation)

SYSTEM_INSTRUCTION = """You are FounderOS's Explanation Agent.

Explain recommendations using ONLY:
1. Scores
2. Retrieved context
3. User supplied information.

Do not assume:
- investor preferences
- previous meetings
- startup metrics.

If evidence is insufficient,
state that more information is required.
"""

PROMPT_TEMPLATE = """
Please generate a concise explanation based on this investor relationship context:

Recommendation to Explain:
{recommendation}

Investor Relationship Memory:
{investor_memory}

Past Meeting History:
{meeting_history}
"""

def explain_recommendation(
    recommendation: str,
    investor_memory: str,
    meeting_history: str
) -> ExplanationOutput:
    """
    Invokes Gemini to synthesize a recommendation explanation.
    """
    if not recommendation or not recommendation.strip():
        logger.warning("Empty recommendation provided. Returning fallback explanation.")
        return rule_based_explain("", "", "")
        
    prompt = PROMPT_TEMPLATE.format(
        recommendation=recommendation,
        investor_memory=investor_memory or "No past memories logged.",
        meeting_history=meeting_history or "No past meetings logged."
      )
    
    fallback = rule_based_explain(recommendation, investor_memory, meeting_history)
    return generate_structured_output(
        prompt=prompt,
        response_schema=ExplanationOutput,
        system_instruction=SYSTEM_INSTRUCTION,
        mock_fallback_data=fallback
    )
