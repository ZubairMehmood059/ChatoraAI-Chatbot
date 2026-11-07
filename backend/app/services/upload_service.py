import os
import re
from fastapi import HTTPException, status
from backend.app.schemas.upload import FileUploadResponse

ALLOWED_EXTENSIONS = {
    ".txt",
    ".md",
    ".json",
    ".csv",
    ".js",
    ".ts",
    ".py",
    ".html",
    ".css",
    ".pdf",
}

MAX_FILE_CHARS = 3_000_000  # Approx 2-3MB text representation
MAX_EXTRACT_CHARS = 15_000  # Safe context window insertion limit


class UploadService:
    """Service for validating, sanitizing, and extracting readable text from user uploads."""

    @staticmethod
    def process_upload(file_name: str, file_content: str, file_type: str = None) -> FileUploadResponse:
        if not file_name or not file_content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing file payload or empty content",
            )

        # 1. Path traversal prevention and filename sanitization
        base_name = os.path.basename(file_name)
        safe_name = re.sub(r"[^a-zA-Z0-9._-]", "_", base_name)
        if not safe_name or safe_name.startswith("."):
            safe_name = f"document_{safe_name.lstrip('.')}"

        # 2. File size limit enforcement
        if len(file_content) > MAX_FILE_CHARS:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail="File size exceeds the 2MB limit",
            )

        # 3. Extension and file type validation
        ext = os.path.splitext(safe_name)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {ext or 'unknown'} is not supported. Please upload plain text, code, or markdown documents.",
            )

        # 4. Extract and normalize content snippet
        extracted_text = file_content[:MAX_EXTRACT_CHARS]

        return FileUploadResponse(
            success=True,
            fileName=safe_name,
            fileType=file_type or ext,
            extractedLength=len(extracted_text),
            content=extracted_text,
        )


upload_service = UploadService()
