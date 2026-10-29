import os
from flask import Flask, render_to_string, render_template
from app.extensions import db
from config import Config, DevelopmentConfig, ProductionConfig, TestingConfig

def create_app(config_class=None):
    app = Flask(__name__, template_folder='../templates', static_folder='../static')

    if config_class is None:
        env = os.environ.get('FLASK_ENV', 'development')
        if env == 'production':
            config_class = ProductionConfig
        elif env == 'testing':
            config_class = TestingConfig
        else:
            config_class = DevelopmentConfig

    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)

    # Register Blueprints
    from app.routes.health import health_bp
    from app.routes.conversations import conversations_bp
    from app.routes.chat import chat_bp
    from app.routes.auth import auth_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(conversations_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(auth_bp)

    @app.route('/')
    def index():
        return render_template('index.html')

    @app.errorhandler(404)
    def page_not_found(e):
        return render_template('errors/404.html'), 404

    @app.errorhandler(500)
    def internal_server_error(e):
        return render_template('errors/500.html'), 500

    # Auto-create tables in development
    with app.app_context():
        db.create_all()

    return app
