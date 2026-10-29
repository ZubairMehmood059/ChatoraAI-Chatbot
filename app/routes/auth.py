from flask import Blueprint, request, jsonify, session
from app.extensions import db
from app.models.user import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or '@' not in email:
        return jsonify({'error': 'Please provide a valid email address'}), 400
    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters long'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'An account with this email already exists'}), 400

    user = User(email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    session['user_id'] = user.id
    return jsonify({'success': True, 'user': user.to_dict()}), 201

@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        # Generic error to prevent enumeration
        return jsonify({'error': 'Email or password is incorrect'}), 401

    session['user_id'] = user.id
    return jsonify({'success': True, 'user': user.to_dict()})

@auth_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@auth_bp.route('/api/auth/me', methods=['GET'])
def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'authenticated': False}), 200
    user = User.query.get(user_id)
    if not user:
        session.pop('user_id', None)
        return jsonify({'authenticated': False}), 200
    return jsonify({'authenticated': True, 'user': user.to_dict()})
