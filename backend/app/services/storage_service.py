import hashlib
import json
import logging
import os
import re
import secrets
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from backend.app.schemas.conversation import ConversationDetail, ConversationSummary
from backend.app.schemas.message import MessageResponse

logger = logging.getLogger("chatora_storage")

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
INSTANCE_DIR = ROOT_DIR / "instance"
CONVERSATIONS_FILE = INSTANCE_DIR / "conversations.json"
USERS_FILE = INSTANCE_DIR / "users.json"
FEEDBACK_FILE = INSTANCE_DIR / "feedback.json"

_lock = threading.Lock()


class StorageService:
    """Thread-safe persistent storage service for conversations, messages, feedback, and local auth."""

    def __init__(self):
        INSTANCE_DIR.mkdir(parents=True, exist_ok=True)

    def _read_json(self, file_path: Path, default_factory) -> Any:
        with _lock:
            if not file_path.exists():
                data = default_factory()
                self._write_json_locked(file_path, data)
                return data
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error("Error reading %s: %s", file_path, e)
                return default_factory()

    def _write_json_locked(self, file_path: Path, data: Any):
        try:
            temp_file = file_path.with_suffix(".tmp")
            with open(temp_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            temp_file.replace(file_path)
        except Exception as e:
            logger.error("Error writing %s: %s", file_path, e)

    def _load_conversations_raw(self) -> List[Dict[str, Any]]:
        def default_convos():
            now = datetime.now(timezone.utc).isoformat()
            return [
                {
                    "id": "conv_init_1",
                    "title": "Streaming AI Architecture & SSE",
                    "pinned": True,
                    "createdAt": now,
                    "updatedAt": now,
                    "userId": "guest",
                    "messages": [
                        {
                            "id": "msg_u_1",
                            "role": "user",
                            "content": "Explain how Server-Sent Events (SSE) compare to WebSockets for real-time streaming AI responses.",
                            "timestamp": now,
                            "status": "complete",
                        },
                        {
                            "id": "msg_a_1",
                            "role": "assistant",
                            "content": "Server-Sent Events (SSE) provide an elegant, unidirectional HTTP streaming protocol that fits LLM generation workflows.\n\n### Key Advantages of SSE:\n1. **Native HTTP/2 Multiplexing:** Works over standard HTTP ports without special reverse proxy protocol upgrades.\n2. **Automatic Reconnection:** Browsers natively manage network drops via the `EventSource` protocol.\n3. **Simpler Mental Model:** Unidirectional streaming matches the server-to-client token delivery model without WebSocket handshake overhead.",
                            "timestamp": now,
                            "status": "complete",
                        },
                    ],
                }
            ]

        raw = self._read_json(CONVERSATIONS_FILE, default_convos)
        if isinstance(raw, list):
            return raw
        return []

    def _save_conversations_raw(self, convos: List[Dict[str, Any]]):
        with _lock:
            self._write_json_locked(CONVERSATIONS_FILE, convos)

    # --- Conversation CRUD ---

    def list_conversations(
        self, user_id: Optional[str] = None, search: Optional[str] = None
    ) -> List[ConversationSummary]:
        convos = self._load_conversations_raw()
        target_uid = user_id or "guest"

        filtered = []
        for c in convos:
            convo_uid = c.get("userId") or "guest"
            if user_id:
                if convo_uid != target_uid:
                    continue
            else:
                if convo_uid not in ("guest", None):
                    continue

            if search:
                if search.lower() not in c.get("title", "").lower():
                    continue

            msgs = c.get("messages", [])
            last_snippet = msgs[-1].get("content", "")[:80] if msgs else ""
            filtered.append(
                ConversationSummary(
                    id=c["id"],
                    title=c.get("title", "New Conversation"),
                    pinned=bool(c.get("pinned", False)),
                    createdAt=c.get("createdAt", datetime.now(timezone.utc).isoformat()),
                    updatedAt=c.get("updatedAt", datetime.now(timezone.utc).isoformat()),
                    messageCount=len(msgs),
                    snippet=last_snippet,
                    userId=convo_uid,
                )
            )

        # Sort: Pinned first, then updatedAt descending
        filtered.sort(
            key=lambda x: (not x.pinned, x.updatedAt),
            reverse=False,
        )
        return filtered

    def create_conversation(
        self, title: Optional[str] = None, user_id: Optional[str] = None
    ) -> ConversationDetail:
        convos = self._load_conversations_raw()
        now = datetime.now(timezone.utc).isoformat()
        convo_id = f"conv_{int(datetime.now().timestamp() * 1000)}_{secrets.token_hex(4)}"

        new_convo = {
            "id": convo_id,
            "title": title or "New Conversation",
            "pinned": False,
            "createdAt": now,
            "updatedAt": now,
            "messages": [],
            "userId": user_id or "guest",
        }
        convos.insert(0, new_convo)
        self._save_conversations_raw(convos)
        return ConversationDetail(**new_convo)

    def get_conversation(
        self, convo_id: str, user_id: Optional[str] = None
    ) -> ConversationDetail:
        convos = self._load_conversations_raw()
        convo = next((c for c in convos if c["id"] == convo_id), None)
        if not convo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        owner = convo.get("userId")
        if owner and owner != "guest":
            if not user_id or user_id != owner:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden: You do not have permission to view this conversation",
                )

        return ConversationDetail(
            id=convo["id"],
            title=convo.get("title", "New Conversation"),
            pinned=bool(convo.get("pinned", False)),
            createdAt=convo.get("createdAt", datetime.now(timezone.utc).isoformat()),
            updatedAt=convo.get("updatedAt", datetime.now(timezone.utc).isoformat()),
            messages=[MessageResponse(**m) for m in convo.get("messages", [])],
            userId=convo.get("userId"),
        )

    def update_conversation(
        self,
        convo_id: str,
        title: Optional[str] = None,
        pinned: Optional[bool] = None,
        user_id: Optional[str] = None,
    ) -> ConversationDetail:
        convos = self._load_conversations_raw()
        convo = next((c for c in convos if c["id"] == convo_id), None)
        if not convo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        owner = convo.get("userId")
        if owner and owner != "guest":
            if not user_id or user_id != owner:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden: You do not have permission to modify this conversation",
                )

        if title is not None and title.strip():
            convo["title"] = title.strip()
        if pinned is not None:
            convo["pinned"] = pinned
        convo["updatedAt"] = datetime.now(timezone.utc).isoformat()

        self._save_conversations_raw(convos)
        return ConversationDetail(
            id=convo["id"],
            title=convo["title"],
            pinned=convo.get("pinned", False),
            createdAt=convo.get("createdAt"),
            updatedAt=convo.get("updatedAt"),
            messages=[MessageResponse(**m) for m in convo.get("messages", [])],
            userId=convo.get("userId"),
        )

    def delete_conversation(self, convo_id: str, user_id: Optional[str] = None) -> bool:
        convos = self._load_conversations_raw()
        convo = next((c for c in convos if c["id"] == convo_id), None)
        if not convo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        owner = convo.get("userId")
        if owner and owner != "guest":
            if not user_id or user_id != owner:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden: You do not have permission to delete this conversation",
                )

        updated_convos = [c for c in convos if c["id"] != convo_id]
        self._save_conversations_raw(updated_convos)
        return True

    def clear_all_conversations(self, user_id: Optional[str] = None) -> int:
        convos = self._load_conversations_raw()
        target_uid = user_id or "guest"

        kept = []
        cleared_count = 0
        for c in convos:
            owner = c.get("userId") or "guest"
            if user_id:
                if owner == target_uid:
                    cleared_count += 1
                else:
                    kept.append(c)
            else:
                if owner in ("guest", None):
                    cleared_count += 1
                else:
                    kept.append(c)

        self._save_conversations_raw(kept)
        return cleared_count

    # --- Feedback Storage ---

    def save_feedback(
        self,
        name: str,
        email: str,
        category: str,
        message: str,
        ip_hash: Optional[str] = None,
    ) -> str:
        submissions = self._read_json(FEEDBACK_FILE, list)
        ref_id = f"fb_{int(datetime.now().timestamp() * 1000)}_{secrets.token_hex(3)}"
        record = {
            "id": ref_id,
            "name": name.strip()[:100],
            "email": email.strip().lower()[:150],
            "category": category,
            "message": message.strip()[:3000],
            "ipHash": ip_hash,
            "createdAt": datetime.now(timezone.utc).isoformat(),
        }
        submissions.insert(0, record)
        with _lock:
            self._write_json_locked(FEEDBACK_FILE, submissions)
        return ref_id

    # --- Local User Storage & Passwords ---

    def _hash_password(self, password: str, salt: str) -> str:
        return hashlib.pbkdf2_hmac("sha512", password.encode(), salt.encode(), 1000).hex()

    def register_local_user(self, email: str, password: str) -> Dict[str, Any]:
        users = self._read_json(USERS_FILE, list)
        normalized_email = email.strip().lower()
        if any(u["email"] == normalized_email for u in users):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists",
            )

        salt = secrets.token_hex(16)
        user_id = f"user_{secrets.token_hex(6)}"
        now = datetime.now(timezone.utc).isoformat()
        new_user = {
            "id": user_id,
            "email": normalized_email,
            "salt": salt,
            "passwordHash": self._hash_password(password, salt),
            "createdAt": now,
        }
        users.append(new_user)
        with _lock:
            self._write_json_locked(USERS_FILE, users)

        return {"id": user_id, "email": normalized_email, "createdAt": now}

    def authenticate_local_user(self, email: str, password: str) -> Dict[str, Any]:
        users = self._read_json(USERS_FILE, list)
        normalized_email = email.strip().lower()
        user = next((u for u in users if u["email"] == normalized_email), None)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email or password is incorrect",
            )

        calc_hash = self._hash_password(password, user["salt"])
        if not secrets.compare_digest(calc_hash, user["passwordHash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email or password is incorrect",
            )

        return {"id": user["id"], "email": user["email"], "createdAt": user.get("createdAt")}


storage = StorageService()

