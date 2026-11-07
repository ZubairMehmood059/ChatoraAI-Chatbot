import logging
from typing import AsyncGenerator, List, Optional
from google import genai
from google.genai import errors as genai_errors
from google.genai import types

from backend.app.config import get_settings
from backend.app.schemas.chat import ChatHistoryItem

logger = logging.getLogger("chatora_ai_service")


class GeminiAIService:
    """Service encapsulating Google Gemini API interactions using the official google-genai SDK."""

    def __init__(self):
        self._client: Optional[genai.Client] = None
        self._initialized_key: Optional[str] = None

    def _get_client(self) -> genai.Client:
        settings = get_settings()
        api_key = settings.GEMINI_API_KEY
        if not api_key or not settings.is_gemini_configured:
            raise ValueError("GEMINI_NOT_CONFIGURED")

        if self._client is None or self._initialized_key != api_key:
            self._client = genai.Client(
                api_key=api_key,
                http_options={"headers": {"User-Agent": "chatora-ai-python"}},
            )
            self._initialized_key = api_key
        return self._client

    def build_system_instruction(
        self,
        response_style: str = "balanced",
        response_language: str = "auto",
    ) -> str:
        instruction = (
            "You are Chatora AI, an intelligent, helpful, professional, and friendly AI assistant. "
            "Format your responses with clean Markdown, clear headings, structured lists, and "
            "well-commented code blocks where applicable."
        )
        if response_style == "concise":
            instruction += " Be extremely concise, direct, and avoid filler explanations unless explicitly asked."
        elif response_style == "detailed":
            instruction += (
                " Provide deep, comprehensive, nuanced, and detailed analysis with step-by-step breakdowns, "
                "edge cases, and rich examples."
            )
        if response_language and response_language != "auto":
            instruction += f" You MUST write your entire response in {response_language}."
        return instruction

    def build_contents(
        self,
        message: str,
        history: Optional[List[ChatHistoryItem]] = None,
    ) -> List[types.Content]:
        contents: List[types.Content] = []
        recent = (history or [])[-10:]
        for item in recent:
            role = "model" if item.role in ("assistant", "model") else "user"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=item.content)],
                )
            )
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=message)],
            )
        )
        return contents

    async def generate_title(self, prompt_text: str) -> str:
        """Generate a short 3-5 word title for the conversation."""
        fallback = prompt_text.strip()[:32].replace("\n", " ").strip()
        if len(prompt_text) > 32:
            fallback += "…"

        try:
            client = self._get_client()
            settings = get_settings()
            prompt = (
                "Create a brief 3-5 word title summarizing this message. Do not use quotes or markdown:\n\n"
                f"{prompt_text[:300]}"
            )
            response = await client.aio.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
            )
            title = (response.text or "").strip().strip("\"'").replace("\n", " ")
            if title and len(title) < 50:
                return title
        except Exception as e:
            logger.debug("Failed auto-generating title: %s", e)
        return fallback or "New Chat"

    async def stream_chat(
        self,
        message: str,
        history: Optional[List[ChatHistoryItem]] = None,
        response_style: str = "balanced",
        response_language: str = "auto",
        client_override: Optional[genai.Client] = None,
    ) -> AsyncGenerator[str, None]:
        """Stream chunks from Gemini via async client."""
        client = client_override or self._get_client()
        settings = get_settings()
        system_instruction = self.build_system_instruction(response_style, response_language)
        contents = self.build_contents(message, history)
        config = types.GenerateContentConfig(system_instruction=system_instruction)

        try:
            stream = await client.aio.models.generate_content_stream(
                model=settings.GEMINI_MODEL,
                contents=contents,
                config=config,
            )
            async for chunk in stream:
                text = chunk.text
                if text:
                    yield text
        except (genai_errors.APIError, Exception) as err:
            err_str = str(err)
            # Automatic fallback to gemini-flash-latest if model is busy / unavailable
            if any(term in err_str for term in ("503", "high demand", "UNAVAILABLE")):
                logger.warning("Primary model busy, falling back to gemini-flash-latest...")
                fallback_stream = await client.aio.models.generate_content_stream(
                    model="gemini-flash-latest",
                    contents=contents,
                    config=config,
                )
                async for chunk in fallback_stream:
                    text = chunk.text
                    if text:
                        yield text
            else:
                raise


ai_service = GeminiAIService()

