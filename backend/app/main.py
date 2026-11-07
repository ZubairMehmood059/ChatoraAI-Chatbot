import logging
import sys
import time
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from backend.app.config import get_settings
from backend.app.database import close_db, init_db
from backend.app.routers import (
    auth_router,
    chat_router,
    conversations_router,
    feedback_router,
    health_router,
    upload_router,
)

# Configure structured application logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("chatora_backend")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager for application startup and shutdown."""
    settings = get_settings()
    logger.info(
        "Starting %s v%s in %s mode (Gemini: %s, Supabase: %s, DB: %s)",
        settings.APP_NAME,
        settings.APP_VERSION,
        settings.ENVIRONMENT,
        settings.is_gemini_configured,
        settings.is_supabase_configured,
        settings.is_db_configured,
    )
    # Initialize database tables
    try:
        await init_db()
    except Exception as e:
        logger.error("Failed to initialize database during startup: %s", e)

    yield

    # Cleanly dispose connection pool
    try:
        await close_db()
    except Exception as e:
        logger.error("Failed to close database during shutdown: %s", e)
    logger.info("Shutting down %s...", settings.APP_NAME)


def create_app() -> FastAPI:
    """FastAPI application factory."""
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="High-performance asynchronous Python backend for Chatora AI.",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # 1. Security Headers Middleware
    class SecurityHeadersMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request: Request, call_next) -> Response:
            response = await call_next(request)
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
            return response

    app.add_middleware(SecurityHeadersMiddleware)

    # 2. CORS Middleware Configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 3. Centralized Exception Handlers
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        logger.warning(
            "HTTP %s at %s: %s", exc.status_code, request.url.path, exc.detail
        )
        error_msg = exc.detail if isinstance(exc.detail, str) else "Request error"
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": error_msg,
                "statusCode": exc.status_code,
                "path": request.url.path,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        clean_errors = []
        for err in exc.errors():
            clean_errors.append({
                "type": err.get("type"),
                "loc": err.get("loc"),
                "msg": err.get("msg"),
            })
        first_msg = clean_errors[0]["msg"] if clean_errors else "Validation error in request payload"
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error": first_msg,
                "details": clean_errors,
                "path": request.url.path,
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        request_id = f"err_{uuid.uuid4().hex[:8]}"
        logger.error(
            "Unhandled exception [req_id=%s] at %s: %s",
            request_id,
            request.url.path,
            str(exc),
            exc_info=True,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "An unexpected server error occurred",
                "requestId": request_id,
            },
        )

    # 4. Mount Routers
    app.include_router(health_router)
    app.include_router(chat_router)
    app.include_router(conversations_router)
    app.include_router(upload_router)
    app.include_router(feedback_router)
    app.include_router(auth_router)

    # 5. Catch-all for unhandled /api/* routes returning JSON 404 rather than HTML
    @app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
    async def api_not_found(request: Request, path: str) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"error": "API route not found", "path": f"/api/{path}"},
        )

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "backend.app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=(settings.ENVIRONMENT == "development"),
    )

