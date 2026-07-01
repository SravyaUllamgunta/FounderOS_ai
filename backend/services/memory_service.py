from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
from backend.models.memory import Memory
from backend.models.investor import Investor
from backend.schemas.memory import MemoryCreate
from backend.tools.embedding_tool import EmbeddingTool
from backend.tools.qdrant_tool import QdrantTool

class MemoryService:
    @staticmethod
    def get_all(db: Session, owner_id: int, investor_id: Optional[str] = None, limit: int = 100, offset: int = 0) -> List[Memory]:
        query = db.query(Memory).filter(Memory.owner_id == owner_id)
        if investor_id is not None:
            query = query.filter(Memory.investor_id == investor_id)
        return query.order_by(Memory.created_at.desc()).offset(offset).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, memory_id: int, owner_id: int) -> Optional[Memory]:
        return (
            db.query(Memory)
            .filter(Memory.id == memory_id, Memory.owner_id == owner_id)
            .first()
        )

    @staticmethod
    def create(db: Session, qdrant: QdrantTool, memory_in: MemoryCreate, owner_id: int) -> Memory:
        investor = (
            db.query(Investor)
            .filter(Investor.id == memory_in.investor_id, Investor.owner_id == owner_id)
            .first()
        )
        if not investor:
            raise ValueError("Investor not found")

        # 1. Store in SQL DB
        db_memory = Memory(
            investor_id=memory_in.investor_id,
            owner_id=owner_id,
            memory=memory_in.memory,
            memory_type=memory_in.memory_type,
            created_at=datetime.utcnow()
        )
        db.add(db_memory)
        db.commit()
        db.refresh(db_memory)

        # 2. Index in Vector DB
        try:
            vector = EmbeddingTool.generate_embedding(db_memory.memory)
            qdrant.upsert_vector(
                collection="investor_memories",
                point_id=db_memory.id,
                vector=vector,
                payload={
                    "id": db_memory.id,
                    "owner_id": owner_id,
                    "investor_id": db_memory.investor_id,
                    "memory_type": db_memory.memory_type,
                    "memory": db_memory.memory
                }
            )
        except Exception as e:
            # Output warning but allow SQL data to persist
            print(f"Warning: Failed to index vector in Qdrant: {e}")

        return db_memory

    @staticmethod
    def update(db: Session, qdrant: QdrantTool, memory_id: int, new_text: str, owner_id: int) -> Optional[Memory]:
        db_memory = MemoryService.get_by_id(db, memory_id, owner_id)
        if not db_memory:
            return None
        
        db_memory.memory = new_text
        db.commit()
        db.refresh(db_memory)

        # Update Vector DB
        try:
            vector = EmbeddingTool.generate_embedding(db_memory.memory)
            qdrant.upsert_vector(
                collection="investor_memories",
                point_id=db_memory.id,
                vector=vector,
                payload={
                    "id": db_memory.id,
                    "owner_id": owner_id,
                    "investor_id": db_memory.investor_id,
                    "memory_type": db_memory.memory_type,
                    "memory": db_memory.memory
                }
            )
        except Exception as e:
            print(f"Warning: Failed to update vector in Qdrant: {e}")

        return db_memory

    @staticmethod
    def delete(db: Session, qdrant: QdrantTool, memory_id: int, owner_id: int) -> bool:
        db_memory = MemoryService.get_by_id(db, memory_id, owner_id)
        if not db_memory:
            return False
        
        db.delete(db_memory)
        db.commit()

        # Remove from Vector DB
        try:
            qdrant.delete_vector(collection="investor_memories", point_id=memory_id)
        except Exception as e:
            print(f"Warning: Failed to delete vector in Qdrant: {e}")

        return True

    @staticmethod
    def search_semantic(qdrant: QdrantTool, query: str, owner_id: int, collection: str = "investor_memories", investor_id: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
        """Generates embedding for a query and searches the specified Qdrant collection."""
        query_vector = EmbeddingTool.generate_embedding(query)
        filter_dict = {"owner_id": owner_id}
        if investor_id is not None:
            filter_dict["investor_id"] = investor_id
        
        results = qdrant.search_vectors(
            collection=collection,
            query_vector=query_vector,
            limit=limit,
            filter_dict=filter_dict if filter_dict else None
        )
        
        memories = []
        for r in results:
            memories.append({
                "id": r.id,
                "score": r.score,
                "payload": r.payload
            })
        return memories
