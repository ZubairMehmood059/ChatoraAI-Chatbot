from datetime import datetime, timezone
import secrets
from typing import Any, Dict, Optional
from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(150), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    ip_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    user_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="feedback",
    )

    __table_args__ = (
        Index("ix_feedback_created_at", "created_at"),
    )

    @classmethod
    def create_new(
        cls,
        name: str,
        email: str,
        category: str,
        message: str,
        user_id: Optional[str] = None,
        ip_hash: Optional[str] = None,
    ) -> "Feedback":
        ref_id = f"fb_{int(datetime.now().timestamp() * 1000)}_{secrets.token_hex(3)}"
        return cls(
            id=ref_id,
            name=name.strip()[:100],
            email=email.strip().lower()[:150],
            category=category,
            message=message.strip()[:3000],
            user_id=user_id if user_id != "guest" else None,
            ip_hash=ip_hash,
            created_at=datetime.now(timezone.utc),
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "category": self.category,
            "message": self.message,
            "userId": self.user_id,
            "createdAt": self.created_at.isoformat() if self.created_at else datetime.now(timezone.utc).isoformat(),
        }

