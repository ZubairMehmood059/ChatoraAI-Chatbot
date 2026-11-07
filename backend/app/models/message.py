from datetime import datetime, timezone
import secrets
from typing import Any, Dict
from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base


class ChatMessage(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    conversation_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # 'user', 'assistant', 'system'
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="complete")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    conversation: Mapped["Conversation"] = relationship(
        "Conversation",
        back_populates="messages",
    )

    __table_args__ = (
        Index("ix_messages_convo_created", "conversation_id", "created_at"),
    )

    @classmethod
    def create_new(
        cls,
        conversation_id: str,
        role: str,
        content: str,
        status: str = "complete",
    ) -> "ChatMessage":
        msg_id = f"msg_{int(datetime.now().timestamp() * 1000)}_{secrets.token_hex(3)}"
        return cls(
            id=msg_id,
            conversation_id=conversation_id,
            role=role,
            content=content,
            status=status,
            created_at=datetime.now(timezone.utc),
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "role": self.role,
            "content": self.content,
            "status": self.status,
            "timestamp": self.created_at.isoformat() if self.created_at else datetime.now(timezone.utc).isoformat(),
        }

