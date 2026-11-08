from datetime import datetime, timezone
import secrets
from typing import Any, Dict, List, Optional
from sqlalchemy import Boolean, DateTime, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base
from backend.app.models.message import ChatMessage
from backend.app.schemas.conversation import ConversationDetail, ConversationSummary
from backend.app.schemas.message import MessageResponse


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, default="New Conversation")
    pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    user_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    messages: Mapped[List[ChatMessage]] = relationship(
        "ChatMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at",
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_conversations_user_updated", "user_id", "updated_at"),
        Index("ix_conversations_user_pinned_updated", "user_id", "pinned", "updated_at"),
    )

    @classmethod
    def create_new(cls, title: Optional[str] = None, user_id: Optional[str] = None) -> "Conversation":
        convo_id = f"conv_{int(datetime.now().timestamp() * 1000)}_{secrets.token_hex(4)}"
        now = datetime.now(timezone.utc)
        return cls(
            id=convo_id,
            title=(title or "New Conversation").strip() or "New Conversation",
            pinned=False,
            user_id=user_id if user_id != "guest" else None,
            created_at=now,
            updated_at=now,
        )

    def to_summary(self) -> ConversationSummary:
        msgs = self.messages or []
        last_snippet = msgs[-1].content[:80] if msgs else ""
        return ConversationSummary(
            id=self.id,
            title=self.title,
            pinned=bool(self.pinned),
            createdAt=self.created_at.isoformat() if self.created_at else datetime.now(timezone.utc).isoformat(),
            updatedAt=self.updated_at.isoformat() if self.updated_at else datetime.now(timezone.utc).isoformat(),
            messageCount=len(msgs),
            snippet=last_snippet,
            userId=self.user_id or "guest",
        )

    def to_detail(self) -> ConversationDetail:
        msgs = self.messages or []
        return ConversationDetail(
            id=self.id,
            title=self.title,
            pinned=bool(self.pinned),
            createdAt=self.created_at.isoformat() if self.created_at else datetime.now(timezone.utc).isoformat(),
            updatedAt=self.updated_at.isoformat() if self.updated_at else datetime.now(timezone.utc).isoformat(),
            messages=[MessageResponse(**m.to_dict()) for m in msgs],
            userId=self.user_id or "guest",
        )

