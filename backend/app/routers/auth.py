from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database import get_db
from backend.app.dependencies import UserContext, get_optional_user
from backend.app.schemas.auth import (
    AuthMeResponse,
    UserAuthRequest,
    UserAuthResponse,
    UserProfile,
)
from backend.app.services.db_service import db_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.get("/me", response_model=AuthMeResponse)
async def get_current_user_profile(
    user: Optional[UserContext] = Depends(get_optional_user),
) -> AuthMeResponse:
    """Return profile of authenticated bearer token user, or unauthenticated status."""
    if user:
        return AuthMeResponse(
            authenticated=True,
            user=UserProfile(
                id=user.id,
                email=user.email,
                role=user.role,
            ),
        )
    return AuthMeResponse(authenticated=False, user=None)


@router.post("/register", response_model=UserAuthResponse, status_code=status.HTTP_201_CREATED)
async def register_local(
    payload: UserAuthRequest,
    db: AsyncSession = Depends(get_db),
) -> UserAuthResponse:
    """Register local fallback demo account in database."""
    res = await db_service.register_local_user(
        db=db,
        email=payload.email,
        password=payload.password,
    )
    return UserAuthResponse(
        success=True,
        user=UserProfile(id=res["id"], email=res["email"], createdAt=res["createdAt"]),
    )


@router.post("/login", response_model=UserAuthResponse)
async def login_local(
    payload: UserAuthRequest,
    db: AsyncSession = Depends(get_db),
) -> UserAuthResponse:
    """Authenticate local fallback demo account against database."""
    res = await db_service.authenticate_local_user(
        db=db,
        email=payload.email,
        password=payload.password,
    )
    return UserAuthResponse(
        success=True,
        user=UserProfile(id=res["id"], email=res["email"], createdAt=res["createdAt"]),
    )


@router.post("/logout")
async def logout() -> dict:
    """Acknowledge user logout."""
    return {"success": True, "message": "Logged out successfully"}
