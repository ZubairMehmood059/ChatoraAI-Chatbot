import os
from typing import Generator, Dict, Any, List
from google import genai

class AIService:
    """Service wrapper for interacting with Google GenAI Gemini models."""

    def __init__(self, api_key: str = None, model: str = 'gemini-3.8-flash'):
        self.api_key = api_key or os.environ.get('GEMINI_API_KEY', '')
        self.model = model
        self.client = None
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)

    def is_configured(self) -> bool:
        return bool(self.api_key and self.client)

    def generate_response(
        self,
        message: str,
        history: List[Dict[str, str]] = None,
        response_style: str = 'balanced'
    ) -> str:
        """Unary content generation."""
        if not self.is_configured():
            raise ValueError("GEMINI_NOT_CONFIGURED: AI provider key is not set.")

        system_instruction = (
            "You are Chatora AI, an intelligent, helpful, professional, and friendly AI assistant. "
            "Format responses with clean Markdown, clear headings, structured lists, and well-commented code."
        )
        if response_style == 'concise':
            system_instruction += " Be extremely concise and direct without filler."
        elif response_style == 'detailed':
            system_instruction += " Provide comprehensive, nuanced, and detailed analysis with step-by-step breakdowns."

        # Format history
        contents = []
        if history:
            for item in history[-10:]:
                role = "user" if item.get("role") == "user" else "model"
                contents.append({
                    "role": role,
                    "parts": [{"text": item.get("content", "")}]
                })
        contents.append({"role": "user", "parts": [{"text": message}]})

        response = self.client.models.generate_content(
            model=self.model,
            contents=contents,
            config={
                "system_instruction": system_instruction,
            }
        )
        return response.text or ""

    def generate_stream(
        self,
        message: str,
        history: List[Dict[str, str]] = None,
        response_style: str = 'balanced'
    ) -> Generator[str, None, None]:
        """Streaming content generation returning text chunks."""
        if not self.is_configured():
            raise ValueError("GEMINI_NOT_CONFIGURED: AI provider key is not set.")

        system_instruction = (
            "You are Chatora AI, an intelligent, helpful, professional, and friendly AI assistant. "
            "Format responses with clean Markdown, clear headings, structured lists, and well-commented code."
        )
        if response_style == 'concise':
            system_instruction += " Be extremely concise and direct without filler."
        elif response_style == 'detailed':
            system_instruction += " Provide comprehensive, nuanced, and detailed analysis with step-by-step breakdowns."

        contents = []
        if history:
            for item in history[-10:]:
                role = "user" if item.get("role") == "user" else "model"
                contents.append({
                    "role": role,
                    "parts": [{"text": item.get("content", "")}]
                })
        contents.append({"role": "user", "parts": [{"text": message}]})

        response_stream = self.client.models.generate_content_stream(
            model=self.model,
            contents=contents,
            config={
                "system_instruction": system_instruction,
            }
        )
        for chunk in response_stream:
            if chunk.text:
                yield chunk.text

    def generate_title(self, prompt: str) -> str:
        """Generate a short 3-5 word title for a conversation."""
        if not self.is_configured():
            return prompt[:30].strip() + ("…" if len(prompt) > 30 else "")

        try:
            resp = self.client.models.generate_content(
                model=self.model,
                contents=f"Generate a concise 3 to 5 word title summarizing this message. No punctuation, quotes, or markdown:\n\n{prompt[:300]}"
            )
            title = resp.text.strip().replace('"', '').replace("'", "")
            return title[:50] if title else prompt[:30].strip()
        except Exception:
            return prompt[:30].strip() + ("…" if len(prompt) > 30 else "")
