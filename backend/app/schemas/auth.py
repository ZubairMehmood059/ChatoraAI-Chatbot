import re
from typing import Optional
from pydantic import BaseModel, Field, field_validator

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class UserProfile(BaseModel):
    """Authenticated user profile."""

    id: str = Field(description="User unique identifier")
    email: str = Field(description="User email address")
    role: Optional[str] = Field(default="authenticated", description="User role")
    createdAt: Optional[str] = Field(default=None, description="Account creation date")


class AuthMeResponse(BaseModel):
    """Response returned by GET /api/auth/me."""

    authenticated: bool = Field(description="Whether the request carries valid user credentials")
    user: Optional[UserProfile] = Field(default=None, description="User object if authenticated")


class UserAuthRequest(BaseModel):
    """Request payload for local/demo registration and login."""

    email: str = Field(description="User email")
    password: str = Field(min_length=8, description="Password (at least 8 characters)")

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        trimmed = v.strip().lower()
        if not EMAIL_REGEX.match(trimmed):
            raise ValueError("Please provide a valid email address")
        return trimmed


class UserAuthResponse(BaseModel):
    """Response returned by local auth endpoints."""

    success: bool = Field(default=True)
    user: Optional[UserProfile] = Field(default=None)
    message: Optional[str] = Field(default=None)

