import base64
import binascii
import io
import logging
import os
import re
from fastapi import HTTPException, status
from backend.app.schemas.upload import FileUploadResponse

logger = logging.getLogger("chatora_upload")

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

MAX_FILE_BYTES = 2 * 1024 * 1024  # 2 MB binary limit
MAX_FILE_CHARS = 3_000_000  # Approx 2-3MB text representation
MAX_EXTRACT_CHARS = 15_000  # Safe context window insertion limit


class UploadService:
    """Service for validating, sanitizing, and extracting readable text from user uploads."""

    @staticmethod
    def _extract_pdf_text(raw_bytes: bytes) -> str:
        """Extract plain text from PDF bytes using pypdf."""
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(raw_bytes))
            if len(reader.pages) == 0:
                raise ValueError("PDF contains no pages")

            pages_text = []
            if len(reader.pages) > 200:
                raise ValueError("PDF has too many pages")

            for page in reader.pages:
                page_text = page.extract_text() or ""
                if page_text.strip():
                    pages_text.append(page_text.strip())

            extracted = "\n\n".join(pages_text).strip()
            if not extracted:
                raise ValueError("No selectable text found in PDF document (may be scanned or image-only).")
            return extracted
        except Exception as e:
            logger.warning("PDF text extraction failed (%s)", type(e).__name__)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not extract text from this PDF. Check that it is a valid, text-based PDF.",
            )

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

        # 2. Extension and file type validation
        ext = os.path.splitext(safe_name)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {ext or 'unknown'} is not supported. Please upload plain text, markdown, or PDF documents.",
            )

        if len(file_content) > MAX_FILE_CHARS:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail="File size exceeds the 2MB limit",
            )

        # 3. Handle PDF (extract via pypdf) vs Text/Markdown/Code
        if ext == ".pdf":
            clean_b64 = file_content
            if "," in clean_b64 and "base64" in clean_b64:
                clean_b64 = clean_b64.split(",", 1)[1]

            try:
                raw_bytes = base64.b64decode(clean_b64, validate=True)
            except (binascii.Error, ValueError):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The PDF payload is malformed. Please choose the file again and retry.",
                )

            if len(raw_bytes) > MAX_FILE_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                    detail="File size exceeds the 2MB limit",
                )

            extracted_text = UploadService._extract_pdf_text(raw_bytes)[:MAX_EXTRACT_CHARS]
        else:
            # Check file size limit for text/markdown
            if len(file_content) > MAX_FILE_CHARS:
                raise HTTPException(
                    status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                    detail="File size exceeds the 2MB limit",
                )
            extracted_text = file_content[:MAX_EXTRACT_CHARS]

        if not extracted_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded file contains no readable text.",
            )

        return FileUploadResponse(
            success=True,
            fileName=safe_name,
            fileType=ext,
            extractedLength=len(extracted_text),
            content=extracted_text,
        )


upload_service = UploadService()
