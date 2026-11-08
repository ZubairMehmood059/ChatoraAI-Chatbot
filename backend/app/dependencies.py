import logging
from typing import Optional
from fastapi import Depends, HTTPException, Request, status
import httpx
from pydantic import BaseModel
from backend.app.config import Settings, get_settings

logger = logging.getLogger("chatora_auth")


class UserContext(BaseModel):
    """Authenticated user context extracted from validated bearer token."""

    id: str
    email: str
    role: str = "authenticated"


async def get_optional_user(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> Optional[UserContext]:
    """Extract authenticated user if bearer token is present; returns None if unauthenticated."""
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header[7:].strip()
    if not token:
        return None

    # Verify bearer credentials with Supabase; never derive a user identity
    # from a caller-controlled token string.
    if settings.is_supabase_configured:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(
                    f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "apikey": settings.SB_SECRET_KEY or settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY,
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    return UserContext(
                        id=data.get("id"),
                        email=data.get("email", "user@chatora.ai"),
                        role=data.get("role", "authenticated"),
                    )
                else:
                    logger.warning("Supabase auth verification failed with HTTP %s", res.status_code)
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid or expired authentication token",
                    )
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Supabase auth probe error: %s", str(e))
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to verify authentication token",
            )

    # Reject credentials when no verification provider is configured.
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
    )


async def get_current_user(
    user: Optional[UserContext] = Depends(get_optional_user),
) -> UserContext:
    """Enforce that the request is authenticated with a valid user token."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to access this resource",
        )
    return user

