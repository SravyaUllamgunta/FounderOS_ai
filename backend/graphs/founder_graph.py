import logging
from typing import Dict, Any, List, Callable
from langgraph.graph import StateGraph, START, END
from backend.agents.planner.planner_agent import PlannerAgent
from backend.agents.retrieval.retrieval_agent import RetrievalAgent
from backend.agents.memory.memory_agent import MemoryAgent
from backend.agents.scoring.scoring_agent import ScoringAgent
from backend.graphs.state import FounderGraphState
from backend.graphs.protocols import Agent

logger = logging.getLogger("founder_graph")

# Initialize agents
planner_agent = PlannerAgent()
retrieval_agent = RetrievalAgent()
memory_agent = MemoryAgent()
scoring_agent = ScoringAgent()

# Dynamic Registry for LangGraph nodes
NODE_REGISTRY: Dict[str, Callable] = {}

def run_communication_node(state: FounderGraphState) -> Dict[str, Any]:
    """Wraps communication agent to generate follow-up email drafts."""
    from backend.agents.communication_agent import draft_communication
    
    investor_name = "General"
    if "retrieved_context" in state and state["retrieved_context"].get("investor"):
        investor_name = state["retrieved_context"]["investor"].get("name", "General")
    elif "extracted_meeting_data" in state:
        investor_name = state["extracted_meeting_data"].get("investor_name", "General")
        
    comm_type = state.get("communication_type", "Follow-up Email")
    tone = state.get("communication_tone", "Professional")
    
    # Extract new fields from payload or fallback to computed ones
    payload = state.get("payload") or {}
    meeting_context = payload.get("meeting_context", "")
    founder_message = payload.get("founder_message", "")
    attachments = payload.get("attachments", [])
    additional_instructions = payload.get("additional_instructions", "")
    
    if not meeting_context:
        recs = state.get("recommendation_data", {})
        actions = recs.get("next_best_actions", [])
        summary = state.get("extracted_meeting_data", {}).get("summary", "")
        meeting_context = f"Summary: {summary}\nRecommendations: {', '.join(actions)}"
    
    comm_out = draft_communication(
        investor_name=investor_name,
        communication_type=comm_type,
        tone=tone,
        meeting_context=meeting_context,
        founder_message=founder_message,
        attachments=attachments,
        additional_instructions=additional_instructions
    )
    return {
        "communication": comm_out.model_dump()
    }

def run_explanation_node(state: FounderGraphState) -> Dict[str, Any]:
    """Wraps explanation agent to explain why a recommendation is strategic and urgent."""
    from backend.agents.explanation_agent import explain_recommendation
    
    recs = state.get("recommendation_data", {})
    recommendation = f"Next best actions: {', '.join(recs.get('next_best_actions', []))}. Reason: {recs.get('reason', '')}"
    
    memories_list = state.get("memories", [])
    investor_memory = "\n".join([m.get("memory", "") for m in memories_list]) if memories_list else "None"
    
    meetings_list = []
    if "retrieved_context" in state and state["retrieved_context"].get("investor"):
        meetings_list = state["retrieved_context"]["investor"].get("meetings", [])
    meeting_history = "\n".join([f"Date: {m.get('date')}, Summary: {m.get('summary')}" for m in meetings_list]) if meetings_list else "None"
    
    explanation_out = explain_recommendation(
        recommendation=recommendation,
        investor_memory=investor_memory,
        meeting_history=meeting_history
    )
    return {
        "explanation": explanation_out.explanation
    }

def create_node_wrapper(node_name: str, run_func: Callable) -> Callable:
    """
    Wraps agent execution functions to handle parameter injection, graceful error logging,
    and automatically increment the state's workflow step pointer (current_index).
    """
    def node_func(state: FounderGraphState) -> FounderGraphState:
        db = state.get("db")
        if db is None:
            from backend.database.session import SessionLocal
            db = SessionLocal()
            
        qdrant = state.get("qdrant")
        if qdrant is None:
            from backend.tools.qdrant_tool import QdrantTool
            qdrant = QdrantTool()
            
        query = state.get("query", "")
        
        # Access owner_id from metadata or state
        owner_id = state.get("owner_id")
        if not owner_id and "metadata" in state:
            owner_id = state["metadata"].get("owner_id")
            
        updates = {}
        errors = list(state.get("errors", []))
        
        try:
            if node_name == "planner":
                # Extract action, query, payload from state/metadata
                action = state.get("action")
                payload = state.get("payload") or {}
                planner_response = run_func(action, query, payload)
                updates = {
                    "workflow": planner_response.workflow,
                    "collections": planner_response.collections,
                    "explanation": planner_response.explanation,
                    "current_index": 0
                }
            elif node_name == "retrieval":
                updates = run_func(query, db, qdrant, owner_id, state.get("collections"))
                ctx = updates.get("retrieved_context", {})
                updates["memories"] = ctx.get("memories", [])
                updates["notes"] = ctx.get("notes", [])
                updates["transcripts"] = ctx.get("transcripts", [])
            elif node_name == "memory":
                retrieved = state.get("retrieved_context") or {}
                if not retrieved and "memories" in state:
                    retrieved = {
                        "investor": state.get("investor"),
                        "memories": state.get("memories")
                    }
                updates = run_func(
                    query=query,
                    retrieved_context=retrieved,
                    extracted_data=state.get("extracted_data", {}),
                    db=db,
                    qdrant=qdrant,
                    owner_id=owner_id
                )
            elif node_name == "scoring":
                retrieved = state.get("retrieved_context") or {}
                if not retrieved and "memories" in state:
                    retrieved = {
                        "investor": state.get("investor"),
                        "memories": state.get("memories")
                    }
                updates = run_func(
                    retrieved_context=retrieved, db=db, owner_id=owner_id
                )
            else:
                updates = run_func(state)
        except Exception as e:
            error_msg = f"Error in agent '{node_name}': {str(e)}"
            logger.error(error_msg, exc_info=True)
            errors.append(error_msg)
            updates = {}

        # Merge state updates and handle step counter
        if not isinstance(updates, dict):
            updates = {}
            
        new_state = {**state, **updates}
        new_state["errors"] = errors
        
        if node_name == "planner":
            new_state["current_index"] = 0
        else:
            new_state["current_index"] = state.get("current_index", 0) + 1
            
        return new_state
        
    return node_func

# Register default core agents
NODE_REGISTRY["planner"] = create_node_wrapper("planner", planner_agent.run)
NODE_REGISTRY["retrieval"] = create_node_wrapper("retrieval", retrieval_agent.run)
NODE_REGISTRY["memory"] = create_node_wrapper("memory", memory_agent.run)
NODE_REGISTRY["scoring"] = create_node_wrapper("scoring", scoring_agent.run)

# Register Person 2 agents from backend/agents/
from backend.agents.extraction_agent import run_extraction_node
from backend.agents.recommendation_agent import run_recommendation_node

NODE_REGISTRY["extract"] = create_node_wrapper("extract", run_extraction_node)
NODE_REGISTRY["recommend"] = create_node_wrapper("recommend", run_recommendation_node)
NODE_REGISTRY["communicate"] = create_node_wrapper("communicate", run_communication_node)
NODE_REGISTRY["explanation"] = create_node_wrapper("explanation", run_explanation_node)

def register_node(name: str, agent_func: Callable):
    """Registers a custom node to the LangGraph orchestrator registry."""
    NODE_REGISTRY[name] = create_node_wrapper(name, agent_func)

def build_graph():
    """Rebuilds and compiles the LangGraph based on the registered nodes."""
    builder = StateGraph(FounderGraphState)

    # 1. Add registered nodes
    for name, func in NODE_REGISTRY.items():
        builder.add_node(name, func)

    # 2. Setup starting node
    builder.add_edge(START, "planner")

    # 3. Define routing edge
    def route_next(state: FounderGraphState) -> str:
        workflow = state.get("workflow", [])
        index = state.get("current_index", 0)
        
        if index < len(workflow):
            next_node = workflow[index]
            if next_node in NODE_REGISTRY:
                return next_node
        return END

    # 4. Attach routing edges to all nodes
    for name in NODE_REGISTRY.keys():
        builder.add_conditional_edges(
            name,
            route_next,
            {node: node for node in NODE_REGISTRY.keys()} | {END: END}
        )

    return builder.compile()

# Default compiled graph
founder_graph = build_graph()

def get_graph():
    """Returns a compiled instance of the current graph."""
    return build_graph()
