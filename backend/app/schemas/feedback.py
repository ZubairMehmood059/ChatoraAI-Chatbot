import re
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class FeedbackCreate(BaseModel):
    """Schema for contact and community feedback submissions."""

    name: str = Field(min_length=2, max_length=100, description="Submitter full name")
    email: str = Field(description="Submitter contact email")
    category: Literal["bug", "feature", "general", "praise"] = Field(description="Feedback category")
    message: str = Field(min_length=10, max_length=3000, description="Feedback message text")
    hp_website: Optional[str] = Field(default=None, description="Honeypot field for spam detection")

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        trimmed = v.strip().lower()
        if not EMAIL_REGEX.match(trimmed):
            raise ValueError("Please provide a valid email address")
        return trimmed


class FeedbackResponse(BaseModel):
    """Feedback submission receipt."""

    success: bool = Field(default=True)
    referenceId: str = Field(description="Tracking identifier")
    message: str = Field(description="Status confirmation message")

