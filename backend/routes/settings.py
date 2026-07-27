from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.extensions import db
from backend.models.settings import Settings
from backend.schemas.settings import SettingsSchema
from backend.middleware.auth import admin_required
from marshmallow import ValidationError

settings_bp = Blueprint('settings', __name__, url_prefix='/settings')
settings_schema = SettingsSchema()

@settings_bp.route('', methods=['GET'])
def get_settings():
    settings = Settings.query.filter_by(id=1).first()
    if not settings:
        settings = Settings(id=1)
        db.session.add(settings)
        db.session.commit()
    return jsonify(settings.to_dict()), 200

@settings_bp.route('', methods=['PUT'])
@admin_required
def update_settings():
    try:
        settings = Settings.query.filter_by(id=1).first()
        if not settings:
            settings = Settings(id=1)
            db.session.add(settings)
            
        data = request.get_json()
        validated_data = settings_schema.load(data, partial=True)
        
        for field, val in validated_data.items():
            if val is not None:
                setattr(settings, field, val)
                
        db.session.commit()
        return jsonify(settings.to_dict()), 200
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
