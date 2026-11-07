import pytest
import uuid
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.app.database import async_session_factory
from backend.app.models.conversation import Conversation
from backend.app.models.feedback import Feedback
from backend.app.models.message import ChatMessage
from backend.app.models.user import User
from backend.app.services.db_service import db_service


@pytest.mark.asyncio
async def test_database_user_and_conversation_cascade():
    """Verify user creation, conversation association, and cascade deletion across separate sessions."""
    unique_email = f"db_test_{uuid.uuid4().hex[:8]}@example.com"
    user_id = None
    convo_id = None
    msg_id = None

    # Step 1: Create user, conversation, and message in session 1
    async with async_session_factory() as session1:
        user = User.create_local(email=unique_email, password="SecretPassword123!")
        session1.add(user)
        await session1.commit()
        await session1.refresh(user)

        user_id = user.id
        assert user_id.startswith("user_")
        assert user.verify_password("SecretPassword123!") is True
        assert user.verify_password("WrongPassword") is False

        convo = Conversation.create_new(title="Cascade Test Chat", user_id=user_id)
        session1.add(convo)
        await session1.commit()
        await session1.refresh(convo)
        convo_id = convo.id

        msg = ChatMessage.create_new(
            conversation_id=convo_id,
            role="user",
            content="Hello from test database cascade!",
        )
        session1.add(msg)
        await session1.commit()
        msg_id = msg.id

    # Step 2: Open clean session 2 to query and verify relations loaded via selectinload
    async with async_session_factory() as session2:
        stmt = (
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .where(Conversation.id == convo_id)
        )
        res = await session2.execute(stmt)
        found_convo = res.scalar_one_or_none()
        assert found_convo is not None
        assert len(found_convo.messages) == 1
        assert found_convo.messages[0].content == "Hello from test database cascade!"

        # Delete conversation and ensure cascade deletion of messages
        await session2.delete(found_convo)
        await session2.commit()

    # Step 3: Verify message was cascade deleted
    async with async_session_factory() as session3:
        msg_stmt = select(ChatMessage).where(ChatMessage.id == msg_id)
        msg_res = await session3.execute(msg_stmt)
        assert msg_res.scalar_one_or_none() is None

        # Clean up user
        user_stmt = select(User).where(User.id == user_id)
        user_res = await session3.execute(user_stmt)
        user_obj = user_res.scalar_one_or_none()
        if user_obj:
            await session3.delete(user_obj)
            await session3.commit()


@pytest.mark.asyncio
async def test_database_feedback_persistence():
    """Verify feedback record creation and querying."""
    async with async_session_factory() as session:
        ref_id = await db_service.save_feedback(
            db=session,
            name="Supabase Tester",
            email="tester@supabase.io",
            category="general",
            message="Testing Postgres RLS and asyncpg connection.",
            user_id=None,
            ip_hash="abc123hash",
        )
        assert ref_id.startswith("fb_")
        await session.commit()

        stmt = select(Feedback).where(Feedback.id == ref_id)
        res = await session.execute(stmt)
        fb = res.scalar_one_or_none()
        assert fb is not None
        assert fb.name == "Supabase Tester"
        assert fb.category == "general"
        assert fb.ip_hash == "abc123hash"

        # Clean up
        await session.delete(fb)
        await session.commit()
