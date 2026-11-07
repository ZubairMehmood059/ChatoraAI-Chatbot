import json
import logging
import secrets
from typing import AsyncGenerator, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.config import get_settings
from backend.app.database import async_session_factory, get_db
from backend.app.dependencies import UserContext, get_optional_user
from backend.app.models.conversation import Conversation
from backend.app.schemas.chat import ChatRequest
from backend.app.services.ai_service import ai_service
from backend.app.services.db_service import db_service

logger = logging.getLogger("chatora_chat")
router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("")
async def chat_stream(
    request: Request,
    payload: ChatRequest,
    user: Optional[UserContext] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Real-time SSE chat endpoint connecting to Google Gemini with context and cancellation support."""
    request_id = f"req_{secrets.token_hex(4)}"
    settings = get_settings()

    # 1. Validate payload
    message = payload.message.strip()
    if not message:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Message cannot be empty", "requestId": request_id},
        )
    if len(message) > settings.MAX_MESSAGE_LENGTH:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": f"Message exceeds {settings.MAX_MESSAGE_LENGTH} character limit", "requestId": request_id},
        )

    user_id = user.id if user else None

    # 2. Check conversation ownership before opening SSE stream
    conversation_id = payload.conversationId
    if conversation_id:
        try:
            # Verify authorization; throws 403 if user lacks access
            await db_service.get_conversation(db=db, convo_id=conversation_id, user_id=user_id)
        except HTTPException as he:
            if he.status_code == status.HTTP_403_FORBIDDEN:
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={
                        "error": "Forbidden: You do not have permission to post to this conversation",
                        "requestId": request_id,
                    },
                )
            # If 404, conversation will be created on first turn

    # 3. Check Gemini API configuration
    if not settings.is_gemini_configured:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": "GEMINI_NOT_CONFIGURED",
                "message": (
                    "Chatora isn’t set up to answer yet. The site owner needs to add an AI "
                    "provider key in the Secrets panel."
                ),
                "requestId": request_id,
            },
        )

    # 4. Save initial user message in database immediately
    if conversation_id:
        try:
            await db_service.append_message(
                db=db,
                convo_id=conversation_id,
                role="user",
                content=message,
                user_id=user_id,
            )
            await db.commit()
        except Exception as e:
            logger.error("Failed saving initial user message: %s", e)
            await db.rollback()

    # 5. Define SSE generator
    async def event_generator() -> AsyncGenerator[str, None]:
        full_text = ""
        is_client_connected = True
        updated_title: Optional[str] = None

        # Initial 'start' event
        yield f"data: {json.dumps({'type': 'start', 'requestId': request_id})}\n\n"

        try:
            async for chunk in ai_service.stream_chat(
                message=message,
                history=payload.history,
                response_style=payload.responseStyle,
                response_language=payload.responseLanguage,
            ):
                # Detect client cancellation / abort
                if await request.is_disconnected():
                    is_client_connected = False
                    logger.info("Client disconnected from chat stream (request_id=%s)", request_id)
                    break

                if chunk:
                    full_text += chunk
                    yield f"data: {json.dumps({'type': 'chunk', 'text': chunk})}\n\n"

            # Auto-generate title if this is the first turn
            if conversation_id and full_text:
                if not payload.history or len(payload.history) <= 1:
                    updated_title = await ai_service.generate_title(message)

            # Persist assistant response in independent database session
            if conversation_id and full_text:
                async with async_session_factory() as save_db:
                    try:
                        msg_status = "complete" if is_client_connected else "stopped"
                        await db_service.append_message(
                            db=save_db,
                            convo_id=conversation_id,
                            role="assistant",
                            content=full_text,
                            status=msg_status,
                            user_id=user_id,
                        )
                        if updated_title:
                            await db_service.update_conversation_title(
                                db=save_db,
                                convo_id=conversation_id,
                                title=updated_title,
                            )
                        await save_db.commit()
                    except Exception as err:
                        logger.error("Failed persisting assistant response: %s", err)
                        await save_db.rollback()

            # Final 'done' event if client is still connected
            if is_client_connected and not await request.is_disconnected():
                yield f"data: {json.dumps({'type': 'done', 'fullText': full_text, 'title': updated_title})}\n\n"

        except Exception as err:
            if await request.is_disconnected():
                logger.info("Stream ended due to client disconnect: %s", err)
                return

            logger.error("Chat streaming error: %s", err)
            error_message = "An unexpected error occurred while communicating with the AI service."
            err_str = str(err)

            if "503" in err_str or "UNAVAILABLE" in err_str or "high demand" in err_str:
                error_message = (
                    "The AI model is currently experiencing temporary high demand from Google. "
                    "Please wait a moment and click Retry."
                )
            elif "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                error_message = "Rate limit reached. Please wait a few seconds before sending another message."
            elif "504" in err_str or "DEADLINE_EXCEEDED" in err_str:
                error_message = "The model took too long to respond. Your message was kept; click Retry to try again."
            elif "API_KEY_INVALID" in err_str or "400" in err_str and "key" in err_str.lower():
                error_message = "Invalid or expired Gemini API key. Please verify your credentials."

            yield f"data: {json.dumps({'type': 'error', 'error': error_message, 'requestId': request_id})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

