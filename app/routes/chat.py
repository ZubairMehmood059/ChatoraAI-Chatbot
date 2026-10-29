import json
import uuid
from flask import Blueprint, request, jsonify, Response, stream_with_context, current_app
from app.extensions import db
from app.models.conversation import Conversation, ChatMessage
from app.services.ai_service import AIService

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/api/chat', methods=['POST'])
def send_message():
    request_id = f"req_{uuid.uuid4().hex[:7]}"
    data = request.get_json() or {}
    message_text = data.get('message', '').strip()
    convo_id = data.get('conversationId')
    history = data.get('history', [])
    response_style = data.get('responseStyle', 'balanced')

    if not message_text:
        return jsonify({'error': 'Message cannot be empty', 'requestId': request_id}), 400

    if len(message_text) > current_app.config.get('MAX_MESSAGE_LENGTH', 8000):
        return jsonify({'error': 'Message exceeds character limit', 'requestId': request_id}), 400

    ai = AIService(
        api_key=current_app.config.get('GEMINI_API_KEY'),
        model=current_app.config.get('GEMINI_MODEL', 'gemini-3.8-flash')
    )

    if not ai.is_configured():
        return jsonify({
            'error': 'GEMINI_NOT_CONFIGURED',
            'message': 'Chatora isn’t set up to answer yet. The site owner needs to add an AI provider key in the environment.',
            'requestId': request_id
        }), 503

    # Persist or find conversation
    convo = None
    if convo_id:
        convo = Conversation.query.get(convo_id)
    if not convo:
        convo = Conversation(title='New Chat')
        db.session.add(convo)
        db.session.commit()
        convo_id = convo.id

    # Add user message
    user_msg = ChatMessage(
        conversation_id=convo_id,
        role='user',
        content=message_text,
        request_id=request_id
    )
    db.session.add(user_msg)
    db.session.commit()

    def generate_sse():
        yield f"data: {json.dumps({'type': 'start', 'requestId': request_id})}\n\n"
        accumulated_text = ""
        try:
            for chunk in ai.generate_stream(message_text, history=history, response_style=response_style):
                accumulated_text += chunk
                yield f"data: {json.dumps({'type': 'chunk', 'text': chunk})}\n\n"

            # Save assistant message
            asst_msg = ChatMessage(
                conversation_id=convo_id,
                role='assistant',
                content=accumulated_text,
                status='complete',
                request_id=request_id
            )
            db.session.add(asst_msg)

            # Auto-title if new chat
            user_msg_count = ChatMessage.query.filter_by(conversation_id=convo_id, role='user').count()
            updated_title = None
            if user_msg_count <= 1 or convo.title == 'New Chat':
                updated_title = ai.generate_title(message_text)
                convo.title = updated_title

            db.session.commit()
            yield f"data: {json.dumps({'type': 'done', 'fullText': accumulated_text, 'title': updated_title})}\n\n"
        except Exception as e:
            db.session.rollback()
            yield f"data: {json.dumps({'type': 'error', 'error': str(e), 'requestId': request_id})}\n\n"

    return Response(
        stream_with_context(generate_sse()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
    )
