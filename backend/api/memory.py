from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.database.session import get_db
from backend.services.auth_service import get_current_user
from backend.models.user import User
from backend.schemas.memory import MemoryCreate, MemoryUpdate, MemoryResponse
from backend.services.memory_service import MemoryService
from backend.tools.qdrant_tool import QdrantTool

router = APIRouter(prefix="/memory", tags=["Memory"])

# Qdrant client instance
qdrant_tool = QdrantTool()

@router.get("", response_model=List[MemoryResponse])
def list_memories(
    investor_id: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return MemoryService.get_all(
        db,
        owner_id=current_user.id,
        investor_id=investor_id,
        limit=limit,
        offset=offset
    )

@router.post("", response_model=MemoryResponse, status_code=status.HTTP_201_CREATED)
def create_memory(
    memory_in: MemoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return MemoryService.create(db, qdrant_tool, memory_in, owner_id=current_user.id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investor not found"
        )

@router.put("/{memory_id}", response_model=MemoryResponse)
def update_memory(
    memory_id: int,
    memory_in: MemoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    memory = MemoryService.update(
        db, qdrant_tool, memory_id, memory_in.memory, owner_id=current_user.id
    )
    if not memory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memory not found"
        )
    return memory

@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory(
    memory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success = MemoryService.delete(db, qdrant_tool, memory_id, owner_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memory not found"
        )
    return
