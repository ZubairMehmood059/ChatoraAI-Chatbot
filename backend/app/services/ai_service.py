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
            for target_model in (settings.GEMINI_MODEL, "gemini-3.5-flash-lite", "gemini-3.5-flash"):
                try:
                    response = await client.aio.models.generate_content(
                        model=target_model,
                        contents=prompt,
                    )
                    title = (response.text or "").strip().strip("\"'").replace("\n", " ")
                    if title and len(title) < 50:
                        return title
                except Exception as inner_err:
                    logger.debug("Failed generating title with %s: %s", target_model, inner_err)
                    continue
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
        """Stream chunks from Gemini via async client with resilient model fallback."""
        client = client_override or self._get_client()
        settings = get_settings()
        system_instruction = self.build_system_instruction(response_style, response_language)
        contents = self.build_contents(message, history)
        config = types.GenerateContentConfig(system_instruction=system_instruction)

        # Fallback candidate models in case primary encounters 503, 404, or capacity issues
        model_candidates = [settings.GEMINI_MODEL]
        for fallback in ("gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash"):
            if fallback not in model_candidates:
                model_candidates.append(fallback)

        last_error = None
        for model_name in model_candidates:
            try:
                stream = await client.aio.models.generate_content_stream(
                    model=model_name,
                    contents=contents,
                    config=config,
                )
                async for chunk in stream:
                    text = chunk.text
                    if text:
                        yield text
                return
            except (genai_errors.APIError, Exception) as err:
                last_error = err
                err_str = str(err)
                logger.warning("Generation with %s failed: %s. Trying fallback...", model_name, err_str)
                continue

        if last_error:
            raise last_error


ai_service = GeminiAIService()

