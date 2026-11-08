from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database import get_db
from backend.app.dependencies import UserContext, get_optional_user
from backend.app.schemas.conversation import (
    ConversationCreate,
    ConversationDetail,
    ConversationSummary,
    ConversationUpdate,
)
from backend.app.services.db_service import db_service

router = APIRouter(prefix="/api/conversations", tags=["Conversations"])


@router.get("", response_model=List[ConversationSummary])
async def list_conversations(
    search: Optional[str] = Query(default=None, description="Search query to filter conversation titles"),
    user: Optional[UserContext] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
) -> List[ConversationSummary]:
    """List conversations scoped strictly to the authenticated user or guest session."""
    user_id = user.id if user else None
    return await db_service.list_conversations(db=db, user_id=user_id, search=search)


@router.post("", response_model=ConversationDetail, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    payload: ConversationCreate,
    user: Optional[UserContext] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationDetail:
    """Create a new conversation assigned to the requesting user."""
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in to save conversation history",
        )
    user_id = user.id
    return await db_service.create_conversation(db=db, title=payload.title, user_id=user_id)


@router.get("/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    conversation_id: str,
    user: Optional[UserContext] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationDetail:
    """Retrieve complete conversation details and messages. Enforces ownership authorization."""
    user_id = user.id if user else None
    return await db_service.get_conversation(db=db, convo_id=conversation_id, user_id=user_id)


@router.patch("/{conversation_id}", response_model=ConversationDetail)
async def update_conversation(
    conversation_id: str,
    payload: ConversationUpdate,
    user: Optional[UserContext] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationDetail:
    """Rename or toggle pin status of a conversation. Enforces ownership authorization."""
    user_id = user.id if user else None
    return await db_service.update_conversation(
        db=db,
        convo_id=conversation_id,
        title=payload.title,
        pinned=payload.pinned,
        user_id=user_id,
    )


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user: Optional[UserContext] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Delete a single conversation. Enforces ownership authorization."""
    user_id = user.id if user else None
    await db_service.delete_conversation(db=db, convo_id=conversation_id, user_id=user_id)
    return {"success": True, "message": "Conversation deleted"}


@router.delete("")
async def clear_all_conversations(
    user: Optional[UserContext] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Delete all conversations belonging exclusively to the requesting user."""
    user_id = user.id if user else None
    await db_service.clear_all_conversations(db=db, user_id=user_id)
    return {"success": True, "message": "All conversations cleared"}
