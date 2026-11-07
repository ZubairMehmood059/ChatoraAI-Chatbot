from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.models.conversation import Conversation
from backend.app.models.feedback import Feedback
from backend.app.models.message import ChatMessage
from backend.app.models.user import User
from backend.app.schemas.conversation import ConversationDetail, ConversationSummary

logger = logging.getLogger("chatora_db_service")


class DatabaseService:
    """Asynchronous database service for conversation, message, feedback, and user persistence."""

    async def list_conversations(
        self,
        db: AsyncSession,
        user_id: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[ConversationSummary]:
        """List conversations scoped strictly to the authenticated user or guest."""
        stmt = (
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .order_by(Conversation.pinned.desc(), Conversation.updated_at.desc())
        )

        if user_id and user_id != "guest":
            stmt = stmt.where(Conversation.user_id == user_id)
        else:
            stmt = stmt.where(Conversation.user_id.is_(None))

        if search and search.strip():
            stmt = stmt.where(Conversation.title.ilike(f"%{search.strip()}%"))

        result = await db.execute(stmt)
        convos = result.scalars().all()
        return [c.to_summary() for c in convos]

    async def create_conversation(
        self,
        db: AsyncSession,
        title: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> ConversationDetail:
        """Create a new conversation assigned to the requesting user."""
        new_convo = Conversation.create_new(title=title, user_id=user_id)
        db.add(new_convo)
        await db.flush()
        await db.refresh(new_convo, attribute_names=["messages"])
        return new_convo.to_detail()

    async def get_conversation(
        self,
        db: AsyncSession,
        convo_id: str,
        user_id: Optional[str] = None,
    ) -> ConversationDetail:
        """Retrieve conversation by ID enforcing ownership authorization."""
        stmt = (
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .where(Conversation.id == convo_id)
        )
        result = await db.execute(stmt)
        convo = result.scalar_one_or_none()

        if not convo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        # Enforce user authorization: prevent IDOR/BOLA
        if convo.user_id is not None:
            if not user_id or user_id != convo.user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden: You do not have permission to view this conversation",
                )

        return convo.to_detail()

    async def update_conversation(
        self,
        db: AsyncSession,
        convo_id: str,
        title: Optional[str] = None,
        pinned: Optional[bool] = None,
        user_id: Optional[str] = None,
    ) -> ConversationDetail:
        """Update conversation title or pinned status with ownership check."""
        stmt = (
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .where(Conversation.id == convo_id)
        )
        result = await db.execute(stmt)
        convo = result.scalar_one_or_none()

        if not convo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        if convo.user_id is not None:
            if not user_id or user_id != convo.user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden: You do not have permission to modify this conversation",
                )

        if title is not None and title.strip():
            convo.title = title.strip()
        if pinned is not None:
            convo.pinned = pinned
        convo.updated_at = datetime.now(timezone.utc)

        await db.flush()
        return convo.to_detail()

    async def delete_conversation(
        self,
        db: AsyncSession,
        convo_id: str,
        user_id: Optional[str] = None,
    ) -> bool:
        """Delete conversation with ownership check."""
        stmt = select(Conversation).where(Conversation.id == convo_id)
        result = await db.execute(stmt)
        convo = result.scalar_one_or_none()

        if not convo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        if convo.user_id is not None:
            if not user_id or user_id != convo.user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden: You do not have permission to delete this conversation",
                )

        await db.delete(convo)
        await db.flush()
        return True

    async def clear_all_conversations(
        self,
        db: AsyncSession,
        user_id: Optional[str] = None,
    ) -> int:
        """Delete all conversations belonging exclusively to requesting user or guest."""
        stmt = delete(Conversation)
        if user_id and user_id != "guest":
            stmt = stmt.where(Conversation.user_id == user_id)
        else:
            stmt = stmt.where(Conversation.user_id.is_(None))

        res = await db.execute(stmt)
        await db.flush()
        return res.rowcount

    async def save_feedback(
        self,
        db: AsyncSession,
        name: str,
        email: str,
        category: str,
        message: str,
        user_id: Optional[str] = None,
        ip_hash: Optional[str] = None,
    ) -> str:
        """Persist feedback submission to database."""
        fb = Feedback.create_new(
            name=name,
            email=email,
            category=category,
            message=message,
            user_id=user_id,
            ip_hash=ip_hash,
        )
        db.add(fb)
        await db.flush()
        return fb.id

    async def register_local_user(
        self,
        db: AsyncSession,
        email: str,
        password: str,
    ) -> Dict[str, Any]:
        """Register local user fallback account in database."""
        normalized_email = email.strip().lower()
        stmt = select(User).where(User.email == normalized_email)
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists",
            )

        user = User.create_local(email=normalized_email, password=password)
        db.add(user)
        await db.flush()
        return user.to_profile_dict()

    async def authenticate_local_user(
        self,
        db: AsyncSession,
        email: str,
        password: str,
    ) -> Dict[str, Any]:
        """Authenticate local user with password verification."""
        normalized_email = email.strip().lower()
        stmt = select(User).where(User.email == normalized_email)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user or not user.verify_password(password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email or password is incorrect",
            )

        return user.to_profile_dict()


    async def append_message(
        self,
        db: AsyncSession,
        convo_id: str,
        role: str,
        content: str,
        status: str = "complete",
        user_id: Optional[str] = None,
    ) -> ChatMessage:
        """Append user or assistant message to conversation, ensuring conversation exists and is authorized."""
        stmt = (
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .where(Conversation.id == convo_id)
        )
        res = await db.execute(stmt)
        convo = res.scalar_one_or_none()

        if not convo:
            # Auto-create conversation if it does not exist yet
            convo = Conversation.create_new(
                title=content.strip()[:36].replace("\n", " ") or "New Chat",
                user_id=user_id,
            )
            convo.id = convo_id
            db.add(convo)
            await db.flush()
        else:
            # Authorize ownership if conversation has owner
            if convo.user_id is not None:
                if not user_id or user_id != convo.user_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Forbidden: You do not have permission to post to this conversation",
                    )

        msg = ChatMessage.create_new(
            conversation_id=convo_id,
            role=role,
            content=content,
            status=status,
        )
        db.add(msg)
        convo.updated_at = datetime.now(timezone.utc)
        await db.flush()
        return msg

    async def update_conversation_title(
        self,
        db: AsyncSession,
        convo_id: str,
        title: str,
    ) -> None:
        """Update conversation title."""
        stmt = select(Conversation).where(Conversation.id == convo_id)
        res = await db.execute(stmt)
        convo = res.scalar_one_or_none()
        if convo and title and title.strip():
            convo.title = title.strip()
            convo.updated_at = datetime.now(timezone.utc)
            await db.flush()


db_service = DatabaseService()

