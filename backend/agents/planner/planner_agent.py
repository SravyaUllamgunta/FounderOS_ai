import json
import logging
import google.generativeai as genai
from typing import Dict, Any
from backend.utils.config import settings
from backend.schemas.planner import PlannerAction, PlannerResponse, PlannerRequest
from backend.agents.planner.planner_examples import EXAMPLES

logger = logging.getLogger("planner_agent")

DEFAULT_FALLBACK = PlannerResponse(
    status="success",
    workflow=["retrieval", "scoring"],
    collections=["investor_memories"],
    needs_retrieval=True,
    requires_approval=False,
    explanation="Default fallback activated due to processing failure."
)

class PlannerAgent:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"
        try:
            self.model = genai.GenerativeModel(model_name)
        except Exception:
            # Fallback to standard model
            self.model = genai.GenerativeModel("gemini-2.5-flash")

    def run(self, action: PlannerAction, query: str = "", payload: Dict[str, Any] = None) -> PlannerResponse:
        """
        Planner Agent run function.
        Determines workflow route. Uses deterministic map for specific actions,
        and LLM reasoning for others.
        """
        if payload is None:
            payload = {}

        # 1. Deterministic ACTION_WORKFLOW_MAP handling
        deterministic_map = {
            PlannerAction.DASHBOARD_LOAD: PlannerResponse(
                status="success",
                workflow=["retrieval", "scoring"],
                collections=["investor_memories"],
                needs_retrieval=True,
                requires_approval=False,
                explanation="Deterministic dashboard load routing."
            ),
            PlannerAction.RELATIONSHIP_SUMMARY: PlannerResponse(
                status="success",
                workflow=["retrieval"],
                collections=["investor_memories"],
                needs_retrieval=True,
                requires_approval=False,
                explanation="Deterministic relationship summary retrieval routing."
            ),
            PlannerAction.STARTUP_PROFILE_UPDATE: PlannerResponse(
                status="success",
                workflow=["scoring"],
                collections=[],
                needs_retrieval=False,
                requires_approval=False,
                explanation="Deterministic startup profile update scoring."
            )
        }

        if action in deterministic_map:
            logger.info(f"Using deterministic route for action: {action}")
            return deterministic_map[action]

        # 2. Non-deterministic / LLM reasoning path
        prompt = f"""You are the Planner Agent for FounderOS AI.

PLANNING PRINCIPLES:
1. Prefer structured payload data over retrieval.
2. Retrieval is OPTIONAL.
3. Retrieve only when:
   - information is missing,
   - historical context is required,
   - user references previous meetings or memories.
4. Use the minimum number of agents.
5. Use the minimum number of collections.
6. Retrieval is a context-enrichment step, not a mandatory first step.

Available agents:
1. 'retrieval': Retrieve database/vector context. Use only when database lookup or semantic memory is needed.
2. 'memory': Create/update memories. Use when recording new commitments, preferences, or details.
3. 'scoring': Calculate matchmaking, readiness, or priority scores.
4. 'extract': Extract information from transcript text or meeting notes.
5. 'recommend': Generate action recommendations.
6. 'communicate': Draft emails, summaries, or thank-you drafts.
7. 'explanation': Explain why a recommendation is strategic.

Available vector collections:
- 'investor_memories'
- 'investor_notes'
- 'meeting_transcripts'

Few-shot Examples:
{json.dumps(EXAMPLES, indent=2)}

Requested Action: {action}
User Query: "{query}"
Payload Context: {json.dumps(payload, indent=2)}

Produce a JSON output matching the following schema structure:
{{
  "status": "success" | "partial" | "failed",
  "workflow": ["agent_name1", "agent_name2", ...],
  "collections": ["collection1", ...],
  "needs_retrieval": true | false,
  "requires_approval": true | false,
  "explanation": "Brief rationale"
}}

Strict JSON Output:"""

        try:
            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            data = json.loads(response.text.strip())
            return PlannerResponse(
                status=data.get("status", "success"),
                workflow=data.get("workflow", []),
                collections=data.get("collections", []),
                needs_retrieval=data.get("needs_retrieval", False),
                requires_approval=data.get("requires_approval", False),
                explanation=data.get("explanation", "")
            )
        except Exception as e:
            logger.error(f"LLM Planner failed: {e}. Falling back to default.")
            return DEFAULT_FALLBACK
