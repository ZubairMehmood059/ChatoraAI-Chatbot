from datetime import datetime, timezone
from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class MessageBase(BaseModel):
    """Base message representation."""

    role: Literal["user", "assistant"] = Field(description="Message author role")
    content: str = Field(min_length=1, max_length=8000, description="Message text content")


class MessageCreate(MessageBase):
    """Schema for message creation."""

    requestId: Optional[str] = Field(default=None, description="Request trace ID")


class MessageResponse(BaseModel):
    """Full message payload matching frontend Message interface."""

    id: str = Field(description="Unique message identifier")
    role: Literal["user", "assistant"] = Field(description="Message author role")
    content: str = Field(description="Message body")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 message timestamp",
    )
    status: Optional[Literal["complete", "stopped", "error"]] = Field(
        default="complete", description="Generation status"
    )
    requestId: Optional[str] = Field(default=None, description="Request trace ID")
    error: Optional[str] = Field(default=None, description="Error message if status is error")

