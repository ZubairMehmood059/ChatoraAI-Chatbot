from datetime import datetime, timezone
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Health check response matching frontend contract."""

    status: str = Field(default="ok", description="Service status")
    version: str = Field(default="1.0.0", description="API version")
    service: str = Field(default="Chatora AI", description="Service name")
    model: str = Field(description="Active Gemini model name")
    configured: bool = Field(description="Whether the AI provider is configured")
    authConfigured: bool = Field(
        default=False,
        description="Whether the backend can validate Supabase bearer tokens",
    )
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 server timestamp",
    )


class ErrorDetail(BaseModel):
    """Standardized API error response format."""

    error: str = Field(description="Error message summary")
    message: Optional[str] = Field(default=None, description="Detailed explanatory message")
    requestId: Optional[str] = Field(default=None, description="Unique trace identifier")
    details: Optional[Any] = Field(default=None, description="Validation or debug details")

