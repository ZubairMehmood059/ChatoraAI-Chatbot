from fastapi import APIRouter, Depends, status
from backend.app.dependencies import UserContext, get_optional_user
from backend.app.schemas.upload import FileUploadRequest, FileUploadResponse
from backend.app.services.upload_service import upload_service

router = APIRouter(prefix="/api/upload", tags=["Upload"])


@router.post("", response_model=FileUploadResponse, status_code=status.HTTP_200_OK)
async def upload_document(
    payload: FileUploadRequest,
    user: UserContext = Depends(get_optional_user),
) -> FileUploadResponse:
    """Validate, sanitize, and extract text from an uploaded document."""
    return upload_service.process_upload(
        file_name=payload.fileName,
        file_content=payload.fileContent,
        file_type=payload.fileType,
    )

