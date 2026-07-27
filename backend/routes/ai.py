from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from backend.services.ai import AIService

ai_bp = Blueprint('ai', __name__, url_prefix='/ai')

@ai_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_ai_analytics():
    try:
        predictions = AIService.get_predictions_and_insights()
        return jsonify(predictions), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
