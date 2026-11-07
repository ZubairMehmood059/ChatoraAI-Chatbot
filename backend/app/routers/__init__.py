from backend.app.routers.auth import router as auth_router
from backend.app.routers.chat import router as chat_router
from backend.app.routers.conversations import router as conversations_router
from backend.app.routers.feedback import router as feedback_router
from backend.app.routers.health import router as health_router
from backend.app.routers.upload import router as upload_router

__all__ = [
    "health_router",
    "chat_router",
    "conversations_router",
    "upload_router",
    "feedback_router",
    "auth_router",
]
