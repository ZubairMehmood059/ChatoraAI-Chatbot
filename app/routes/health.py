from flask import Blueprint, jsonify, current_app
from datetime import datetime, timezone
from app.services.ai_service import AIService

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def check_health():
    ai = AIService(api_key=current_app.config.get('GEMINI_API_KEY'))
    return jsonify({
        'status': 'ok',
        'service': 'Chatora AI (Python/Flask)',
        'model': current_app.config.get('GEMINI_MODEL', 'gemini-3.8-flash'),
        'configured': ai.is_configured(),
        'timestamp': datetime.now(timezone.utc).isoformat(),
    })
