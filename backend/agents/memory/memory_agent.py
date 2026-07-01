import json
import google.generativeai as genai
from sqlalchemy.orm import Session
from backend.utils.config import settings
from backend.services.memory_service import MemoryService
from backend.schemas.memory import MemoryCreate
from backend.tools.qdrant_tool import QdrantTool

class MemoryAgent:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model_name = settings.GEMINI_MODEL or "gemini-1.5-flash"
        try:
            self.model = genai.GenerativeModel(model_name)
        except Exception:
            self.model = genai.GenerativeModel("gemini-1.5-flash")

    def run(self, query: str, retrieved_context: dict, extracted_data: dict, db: Session, qdrant: QdrantTool, owner_id: int) -> dict:
        """
        Identifies key details from the query or extraction results to save as memory records.
        """
        investor_info = retrieved_context.get("investor") if retrieved_context else None
        if not investor_info:
            return {"status": "skipped", "message": "No matching investor context found to save memory."}
        
        investor_id = investor_info.get("id")
        
        prompt = f"""You are the Memory Agent for FounderOS AI.
Analyze the user's query and any extracted data from meeting transcripts, and identify facts that should be saved as investor memories.

Investor: "{investor_info.get('name')}" (Firm: "{investor_info.get('firm')}")
User Query: "{query}"
Extracted Data: {json.dumps(extracted_data) if extracted_data else 'None'}

Available memory types:
- 'preference': Investor preferences (e.g. check size, sector interests, stage, communication style)
- 'concern': Investor concerns, hesitations, or reasons for pause
- 'meeting_note': Key summary points or observations from meetings
- 'action_item': Next steps or commitments made during the meeting
- 'relationship_note': General context about who introduced them, personal details, etc.

For each memory found, structure it in a list. If no memories are found, return an empty list.

Output a JSON object with a single key 'memories' containing a list of objects, each with keys:
- 'memory': A clear, concise statement of the memory.
- 'memory_type': One of: preference, concern, meeting_note, action_item, relationship_note

Strict JSON output:"""

        created_memories = []
        try:
            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            data = json.loads(response.text.strip())
            memories_list = data.get("memories", [])
            
            for mem_item in memories_list:
                text = mem_item.get("memory")
                m_type = mem_item.get("memory_type")
                if text and m_type in ["preference", "concern", "meeting_note", "action_item", "relationship_note"]:
                    # Create memory via service
                    mem_in = MemoryCreate(
                        investor_id=investor_id,
                        memory=text,
                        memory_type=m_type
                    )
                    db_mem = MemoryService.create(
                        db, qdrant, mem_in, owner_id=owner_id
                    )
                    created_memories.append({
                        "id": db_mem.id,
                        "memory": db_mem.memory,
                        "memory_type": db_mem.memory_type
                    })
        except Exception as e:
            print(f"Warning: Memory Agent failed: {e}")
            # Simple heuristic backup in case of error
            if "save note" in query.lower() or "note:" in query.lower():
                mem_in = MemoryCreate(
                    investor_id=investor_id,
                    memory=query,
                    memory_type="meeting_note"
                )
                db_mem = MemoryService.create(
                    db, qdrant, mem_in, owner_id=owner_id
                )
                created_memories.append({
                    "id": db_mem.id,
                    "memory": db_mem.memory,
                    "memory_type": db_mem.memory_type
                })

        return {
            "created_memories": created_memories
        }
