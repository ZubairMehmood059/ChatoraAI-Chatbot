from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class ChatHistoryItem(BaseModel):
    role: Literal["user", "assistant", "model"]
    content: str = Field(..., min_length=1, max_length=8000)


class ChatRequest(BaseModel):
    conversationId: Optional[str] = Field(default=None, description="Target conversation ID")
    message: str = Field(..., min_length=1, max_length=8000, description="User prompt text")
    history: List[ChatHistoryItem] = Field(
        default_factory=list, max_length=20, description="Prior conversation turns"
    )
    responseStyle: Literal["concise", "balanced", "detailed"] = Field(
        default="balanced", description="Generation verbosity style"
    )
    responseLanguage: str = Field(
        default="auto", max_length=64, description="Target response language ('auto' or specific language)"
    )

