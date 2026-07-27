from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.extensions import db
from backend.models.category import Category
from backend.schemas.category import CategorySchema
from marshmallow import ValidationError

categories_bp = Blueprint('categories', __name__, url_prefix='/categories')
category_schema = CategorySchema()

@categories_bp.route('', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify([c.to_dict() for c in categories]), 200

@categories_bp.route('/<int:cat_id>', methods=['GET'])
def get_category(cat_id):
    cat = Category.query.get_or_404(cat_id)
    return jsonify(cat.to_dict()), 200

@categories_bp.route('', methods=['POST'])
@jwt_required()
def create_category():
    try:
        data = request.get_json()
        validated_data = category_schema.load(data)
        
        if Category.query.filter_by(name=validated_data['name']).first():
            return jsonify({"error": f"Category '{validated_data['name']}' already exists"}), 400
            
        new_cat = Category(**validated_data)
        db.session.add(new_cat)
        db.session.commit()
        
        return jsonify(new_cat.to_dict()), 201
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@categories_bp.route('/<int:cat_id>', methods=['PUT'])
@jwt_required()
def update_category(cat_id):
    try:
        cat = Category.query.get_or_404(cat_id)
        data = request.get_json()
        validated_data = category_schema.load(data, partial=True)
        
        if 'name' in validated_data and validated_data['name'] != cat.name:
            if Category.query.filter_by(name=validated_data['name']).first():
                return jsonify({"error": f"Category '{validated_data['name']}' already exists"}), 400

        for field, val in validated_data.items():
            if val is not None:
                setattr(cat, field, val)
                
        db.session.commit()
        return jsonify(cat.to_dict()), 200
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@categories_bp.route('/<int:cat_id>', methods=['DELETE'])
@jwt_required()
def delete_category(cat_id):
    try:
        cat = Category.query.get_or_404(cat_id)
        db.session.delete(cat)
        db.session.commit()
        return jsonify({"success": True, "message": "Category deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
