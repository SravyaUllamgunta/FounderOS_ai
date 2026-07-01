EXAMPLES = [
    {
        "query": "Give me context on Sequoia",
        "action": "CHAT_QUERY",
        "payload": {},
        "response": {
            "status": "success",
            "workflow": ["retrieval", "chat_query"],
            "collections": ["investor_memories", "investor_notes"],
            "needs_retrieval": True,
            "requires_approval": False,
            "explanation": "Querying for specific investor context. Running retrieval on memories and notes, followed by chat query to synthesize results."
        }
    },
    {
        "query": "I had a meeting with Alfred Lin from Sequoia. Analyze our transcript and create followups.",
        "action": "MEETING_ANALYSIS",
        "payload": {"transcript": "Meeting transcript here..."},
        "response": {
            "status": "success",
            "workflow": ["extract", "recommend", "scoring", "explanation"],
            "collections": ["investor_memories"],
            "needs_retrieval": False,
            "requires_approval": True,
            "explanation": "Analyzing meeting transcript to extract insights, update scores, generate recommendations, and compute an explanation."
        }
    },
    {
        "query": "Draft a follow up email to Kirsten from Forerunner",
        "action": "GENERATE_FOLLOWUP",
        "payload": {"investor_name": "Kirsten", "tone": "Friendly"},
        "response": {
            "status": "success",
            "workflow": ["retrieval", "communicate"],
            "collections": ["investor_memories"],
            "needs_retrieval": True,
            "requires_approval": False,
            "explanation": "Retrieving context about Kirsten Green/Forerunner and running the communication agent to draft a follow-up email."
        }
    }
]
