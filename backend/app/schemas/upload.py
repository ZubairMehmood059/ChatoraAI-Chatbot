from typing import Optional
from pydantic import BaseModel, Field


class FileUploadRequest(BaseModel):
    """Schema for document upload and text extraction request."""

    fileName: str = Field(min_length=1, max_length=255, description="Client filename with extension")
    fileContent: str = Field(min_length=1, description="Raw file text or base64 data")
    fileType: Optional[str] = Field(default=None, description="MIME type or client extension")


class FileUploadResponse(BaseModel):
    """Schema returned after successful text extraction."""

    success: bool = Field(default=True, description="Extraction status")
    fileName: str = Field(description="Sanitized safe filename")
    fileType: str = Field(description="Normalized file type/extension")
    extractedLength: int = Field(description="Character length of extracted snippet")
    content: str = Field(description="Sanitized readable text content")
