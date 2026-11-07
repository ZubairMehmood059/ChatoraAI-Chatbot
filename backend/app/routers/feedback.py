import hashlib
import time
from typing import Optional
from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database import get_db
from backend.app.dependencies import UserContext, get_optional_user
from backend.app.schemas.feedback import FeedbackCreate, FeedbackResponse
from backend.app.services.db_service import db_service

router = APIRouter(prefix="/api/feedback", tags=["Feedback"])


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    request: Request,
    response: Response,
    payload: FeedbackCreate,
    user: Optional[UserContext] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
) -> FeedbackResponse:
    """Submit user feedback, bug reports, and suggestions with honeypot spam protection."""
    # Honeypot spam protection: bots often fill hidden inputs
    if payload.hp_website and payload.hp_website.strip():
        response.status_code = status.HTTP_200_OK
        fake_id = f"fb_hp_{int(time.time() * 1000)}"
        return FeedbackResponse(
            success=True,
            referenceId=fake_id,
            message="Thank you for your feedback! The team has received your submission.",
        )

    # Anonymized client IP hash
    forwarded = request.headers.get("x-forwarded-for")
    client_ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "")
    ip_hash = hashlib.sha256(client_ip.encode()).hexdigest()[:12] if client_ip else None

    user_id = user.id if user else None

    ref_id = await db_service.save_feedback(
        db=db,
        name=payload.name,
        email=payload.email,
        category=payload.category,
        message=payload.message,
        user_id=user_id,
        ip_hash=ip_hash,
    )

    return FeedbackResponse(
        success=True,
        referenceId=ref_id,
        message="Thank you for your feedback! The team has received your submission.",
    )
