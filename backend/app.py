import os
from flask import Flask, jsonify
from backend.config import Config
from backend.extensions import db, migrate, jwt, cors
from backend.routes import register_blueprints
from backend.services.db_seeder import seed_db

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Make sure upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Configure CORS to allow communication with frontend (e.g. localhost:5173)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Register blueprints/routes
    register_blueprints(app)

    # Error handling
    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({"error": "An internal server error occurred"}), 500

    # JWT Error handlers for cleaner API responses
    @jwt.unauthorized_loader
    def unauthorized_response(callback):
        return jsonify({"error": "Missing Authorization Header or Token"}), 401

    @jwt.invalid_token_loader
    def invalid_token_response(callback):
        return jsonify({"error": "Signature verification failed"}), 401

    @jwt.expired_token_loader
    def expired_token_response(jwt_header, jwt_payload):
        return jsonify({"error": "The token has expired"}), 401

    # CLI Commands
    @app.cli.command("seed-db")
    def seed_db_command():
        """Seeds the database with default data."""
        print("Seeding database...")
        seed_db()
        print("Done!")

    return app

# Gunicorn entry point
app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
