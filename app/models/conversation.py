from datetime import datetime, timezone
import uuid
from app.extensions import db

def generate_uuid():
    return uuid.uuid4().hex

class Conversation(db.Model):
    __tablename__ = 'conversations'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    title = db.Column(db.String(255), nullable=False, default='New Chat')
    pinned = db.Column(db.Boolean, default=False, nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    messages = db.relationship('ChatMessage', backref='conversation', lazy=True, cascade='all, delete-orphan', order_by='ChatMessage.created_at')

    def to_dict(self, include_messages=False):
        data = {
            'id': self.id,
            'title': self.title,
            'pinned': self.pinned,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'message_count': len(self.messages),
        }
        if include_messages:
            data['messages'] = [m.to_dict() for m in self.messages]
        return data

class ChatMessage(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    conversation_id = db.Column(db.String(36), db.ForeignKey('conversations.id'), nullable=False, index=True)
    role = db.Column(db.String(20), nullable=False)  # 'user' or 'assistant'
    content = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='complete')  # 'complete', 'stopped', 'error'
    request_id = db.Column(db.String(64), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'role': self.role,
            'content': self.content,
            'status': self.status,
            'request_id': self.request_id,
            'timestamp': self.created_at.isoformat(),
        }
