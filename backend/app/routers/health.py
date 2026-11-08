from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from backend.app.config import Settings, get_settings
from backend.app.schemas.common import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def get_health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    """Return health probe information matching existing Express contract."""
    return HealthResponse(
        status="ok",
        version=settings.APP_VERSION,
        service=settings.APP_NAME,
        model=settings.GEMINI_MODEL,
        configured=settings.is_gemini_configured,
        authConfigured=settings.is_supabase_configured,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )

