from datetime import datetime, timezone
import hashlib
import secrets
from typing import Any, Dict, List, Optional
from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    salt: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
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

    conversations: Mapped[List["Conversation"]] = relationship(
        "Conversation",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    feedback: Mapped[List["Feedback"]] = relationship(
        "Feedback",
        back_populates="user",
        lazy="selectin",
    )

    @classmethod
    def create_local(cls, email: str, password: str) -> "User":
        salt = secrets.token_hex(16)
        user_id = f"user_{secrets.token_hex(8)}"
        pwd_hash = cls.hash_password(password, salt)
        return cls(
            id=user_id,
            email=email.strip().lower(),
            password_hash=pwd_hash,
            salt=salt,
        )

    @staticmethod
    def hash_password(password: str, salt: str) -> str:
        return hashlib.pbkdf2_hmac("sha512", password.encode(), salt.encode(), 1000).hex()

    def verify_password(self, password: str) -> bool:
        if not self.password_hash or not self.salt:
            return False
        calc = self.hash_password(password, self.salt)
        return secrets.compare_digest(calc, self.password_hash)

    def to_profile_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "email": self.email,
            "createdAt": self.created_at.isoformat() if self.created_at else datetime.now(timezone.utc).isoformat(),
        }

