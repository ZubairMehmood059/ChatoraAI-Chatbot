from flask import Blueprint, jsonify, request
from app.extensions import db
from app.models.conversation import Conversation, ChatMessage

conversations_bp = Blueprint('conversations', __name__)

@conversations_bp.route('/api/conversations', methods=['GET'])
def list_conversations():
    convos = Conversation.query.order_by(Conversation.updated_at.desc()).all()
    return jsonify([c.to_dict() for c in convos])

@conversations_bp.route('/api/conversations', methods=['POST'])
def create_conversation():
    data = request.get_json() or {}
    title = data.get('title', 'New Chat').strip()
    convo = Conversation(title=title)
    db.session.add(convo)
    db.session.commit()
    return jsonify(convo.to_dict()), 201

@conversations_bp.route('/api/conversations/<convo_id>', methods=['GET'])
def get_conversation(convo_id):
    convo = Conversation.query.get(convo_id)
    if not convo:
        return jsonify({'error': 'Conversation not found'}), 404
    return jsonify(convo.to_dict(include_messages=True))

@conversations_bp.route('/api/conversations/<convo_id>', methods=['PATCH'])
def rename_conversation(convo_id):
    convo = Conversation.query.get(convo_id)
    if not convo:
        return jsonify({'error': 'Conversation not found'}), 404
    data = request.get_json() or {}
    if 'title' in data and data['title'].strip():
        convo.title = data['title'].strip()
    if 'pinned' in data and isinstance(data['pinned'], bool):
        convo.pinned = data['pinned']
    db.session.commit()
    return jsonify(convo.to_dict())

@conversations_bp.route('/api/conversations/<convo_id>', methods=['DELETE'])
def delete_conversation(convo_id):
    convo = Conversation.query.get(convo_id)
    if not convo:
        return jsonify({'error': 'Conversation not found'}), 404
    db.session.delete(convo)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Conversation deleted'})

@conversations_bp.route('/api/conversations', methods=['DELETE'])
def clear_all_conversations():
    ChatMessage.query.delete()
    Conversation.query.delete()
    db.session.commit()
    return jsonify({'success': True, 'message': 'All conversations cleared'})
