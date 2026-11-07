from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.message import MessageResponse


class ConversationCreate(BaseModel):
    """Schema for initiating a new conversation."""

    title: Optional[str] = Field(default="New Conversation", max_length=255, description="Initial conversation title")


class ConversationUpdate(BaseModel):
    """Schema for updating a conversation's title or pin state."""

    title: Optional[str] = Field(default=None, min_length=1, max_length=255, description="Updated conversation title")
    pinned: Optional[bool] = Field(default=None, description="Pin/unpin state")


class ConversationSummary(BaseModel):
    """Lightweight conversation summary for sidebar list view."""

    id: str = Field(description="Conversation ID")
    title: str = Field(description="Conversation title")
    pinned: bool = Field(default=False, description="Whether pinned to top")
    createdAt: str = Field(description="ISO 8601 creation timestamp")
    updatedAt: str = Field(description="ISO 8601 last update timestamp")
    messageCount: int = Field(default=0, description="Total turns in conversation")
    snippet: str = Field(default="", description="Snippet of latest message")
    userId: Optional[str] = Field(default=None, description="Owning user identifier")


class ConversationDetail(BaseModel):
    """Full conversation details including turn history."""

    id: str = Field(description="Conversation ID")
    title: str = Field(description="Conversation title")
    pinned: bool = Field(default=False, description="Whether pinned to top")
    createdAt: str = Field(description="ISO 8601 creation timestamp")
    updatedAt: str = Field(description="ISO 8601 last update timestamp")
    messages: List[MessageResponse] = Field(default_factory=list, description="Ordered conversation messages")
    userId: Optional[str] = Field(default=None, description="Owning user identifier")

