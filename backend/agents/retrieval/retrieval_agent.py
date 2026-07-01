import json
import google.generativeai as genai
from sqlalchemy.orm import Session
from backend.utils.config import settings
from backend.services.investor_service import InvestorService
from backend.services.meeting_service import MeetingService
from backend.services.memory_service import MemoryService
from backend.tools.qdrant_tool import QdrantTool
from typing import List, Dict, Any, Optional

def get_jaccard_similarity(text1: str, text2: str) -> float:
    """Calculates Jaccard similarity based on word tokens."""
    if not text1 or not text2:
        return 0.0
    w1 = set([w.lower().strip() for w in text1.split() if len(w) > 1])
    w2 = set([w.lower().strip() for w in text2.split() if len(w) > 1])
    if not w1 or not w2:
        return 0.0
    return len(w1.intersection(w2)) / len(w1.union(w2))

class RetrievalAgent:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"
        try:
            self.model = genai.GenerativeModel(model_name)
        except Exception:
            self.model = genai.GenerativeModel("gemini-2.5-flash")

    def run(self, query: str, db: Session, qdrant: QdrantTool, owner_id: int, collections: List[str] = None) -> dict:
        """Parses search criteria, queries PostgreSQL and designated Qdrant collections, and deduplicates outcomes."""
        if not collections:
            collections = ["investor_memories"]

        prompt = f"""You are the Retrieval Agent for FounderOS AI.
Analyze the user's query and extract search parameters.

Query: "{query}"

Output a JSON object with:
- 'investor_name': The name of the investor or firm mentioned, or null if none.
- 'semantic_query': A search phrase to find relevant context in investor memories, notes, or transcripts, or null if none.

Strict JSON output:"""
        
        investor_name = None
        semantic_query = None
        
        try:
            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            data = json.loads(response.text.strip())
            investor_name = data.get("investor_name")
            semantic_query = data.get("semantic_query")
            print(f"RetrievalAgent: Extracted investor_name='{investor_name}', semantic_query='{semantic_query}'")
        except Exception as e:
            print(f"RetrievalAgent: Extraction failed, running fallback: {e}")
            
        # Post-processing fallback for null/empty values
        if investor_name == "None" or investor_name == "null":
            investor_name = None
            
        if not investor_name:
            words = query.split()
            for w in words:
                w_clean = w.strip(".,!?\"'()")
                if w_clean and w_clean[0].isupper() and len(w_clean) > 3 and w_clean not in ["I", "Yesterday", "Today", "Meeting", "Ventures", "Capital"]:
                    investor_name = w_clean
                    break
            # Second pass: match short acronyms like "XL"
            if not investor_name:
                for w in words:
                    w_clean = w.strip(".,!?\"'()")
                    if w_clean and w_clean[0].isupper() and len(w_clean) > 1 and w_clean not in ["I", "Yesterday", "Today", "Meeting"]:
                        investor_name = w_clean
                        break
                        
        if not semantic_query or semantic_query == "None" or semantic_query == "null":
            semantic_query = query
            
        print(f"RetrievalAgent Final: investor_name='{investor_name}', semantic_query='{semantic_query}'")
        
        investor_info = None
        
        # Lists to hold raw search hits
        raw_memories = []
        raw_notes = []
        raw_transcripts = []

        # 1. SQL Database query for Investor profile & relational data
        if investor_name:
            investor = InvestorService.get_by_name(db, investor_name, owner_id=owner_id)
            if investor:
                investor_info = {
                    "id": investor.id,
                    "name": investor.name,
                    "firm": investor.firm,
                    "focus": investor.focus,
                    "stage": investor.stage,
                    "preferences": investor.preferences
                }
                
                # Fetch base PostgreSQL memories
                sql_memories = MemoryService.get_all(db, owner_id=owner_id, investor_id=investor.id)
                for mem in sql_memories:
                    raw_memories.append({
                        "id": mem.id,
                        "investor_id": mem.investor_id,
                        "memory": mem.memory,
                        "memory_type": mem.memory_type,
                        "source": "database"
                    })
                
                # Fetch PostgreSQL meeting records
                meetings = MeetingService.get_all(db, owner_id=owner_id, investor_id=investor.id)
                meetings_info = []
                for mt in meetings:
                    meetings_info.append({
                        "id": mt.id,
                        "summary": mt.summary,
                        "date": str(mt.date)
                    })
                if meetings_info:
                    investor_info["meetings"] = meetings_info

        # 2. Qdrant Tiered Vector Search
        if semantic_query:
            investor_id_filter = investor_info["id"] if investor_info else None
            
            for col in collections:
                try:
                    qdrant_results = MemoryService.search_semantic(
                        qdrant,
                        query=semantic_query,
                        owner_id=owner_id,
                        collection=col,
                        investor_id=investor_id_filter,
                        limit=5
                    )
                    
                    for res in qdrant_results:
                        payload = res["payload"]
                        item = {
                            "id": res["id"],
                            "investor_id": payload.get("investor_id"),
                            "score": res["score"],
                            "source": "vector_db"
                        }
                        
                        if col == "investor_memories":
                            item["memory"] = payload.get("memory")
                            item["memory_type"] = payload.get("memory_type")
                            raw_memories.append(item)
                        elif col == "investor_notes":
                            item["note"] = payload.get("note")
                            raw_notes.append(item)
                        elif col == "meeting_transcripts":
                            item["transcript"] = payload.get("transcript")
                            item["summary"] = payload.get("summary")
                            raw_transcripts.append(item)
                            
                except Exception as e:
                    print(f"Warning: Vector search on collection '{col}' failed: {e}")

        # Deduplicate function based on ID and text similarity (Jaccard > 0.85)
        def deduplicate_list(raw_list: List[Dict[str, Any]], text_key: str) -> List[Dict[str, Any]]:
            seen_ids = set()
            deduped = []
            
            for item in raw_list:
                item_id = item.get("id")
                item_text = item.get(text_key) or ""
                
                # Check ID duplication
                if item_id in seen_ids:
                    continue
                
                # Check text similarity with existing items
                duplicate_found = False
                for existing in deduped:
                    existing_text = existing.get(text_key) or ""
                    if get_jaccard_similarity(item_text, existing_text) > 0.85:
                        duplicate_found = True
                        break
                
                if not duplicate_found:
                    if item_id:
                        seen_ids.add(item_id)
                    deduped.append(item)
                    
            return deduped

        # Apply Jaccard deduplication to each list
        deduped_memories = deduplicate_list(raw_memories, "memory")
        deduped_notes = deduplicate_list(raw_notes, "note")
        # For transcripts, compare by transcript text
        deduped_transcripts = deduplicate_list(raw_transcripts, "transcript")

        return {
            "retrieved_context": {
                "investor": investor_info,
                "memories": deduped_memories,
                "notes": deduped_notes,
                "transcripts": deduped_transcripts
            }
        }
