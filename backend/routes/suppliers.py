from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.extensions import db
from backend.models.supplier import Supplier
from backend.schemas.supplier import SupplierSchema
from backend.utils.notifications import create_notification
from marshmallow import ValidationError

suppliers_bp = Blueprint('suppliers', __name__, url_prefix='/suppliers')
supplier_schema = SupplierSchema()

@suppliers_bp.route('', methods=['GET'])
def get_suppliers():
    suppliers = Supplier.query.all()
    return jsonify([s.to_dict() for s in suppliers]), 200

@suppliers_bp.route('/<int:sup_id>', methods=['GET'])
def get_supplier(sup_id):
    sup = Supplier.query.get_or_404(sup_id)
    return jsonify(sup.to_dict()), 200

@suppliers_bp.route('', methods=['POST'])
@jwt_required()
def create_supplier():
    try:
        data = request.get_json()
        validated_data = supplier_schema.load(data)
        
        new_sup = Supplier(**validated_data)
        db.session.add(new_sup)
        
        create_notification(
            type_val='INFO',
            title='Supplier Registered Alert',
            message=f"Supplier '{new_sup.name}' has been successfully registered."
        )

        db.session.commit()
        return jsonify(new_sup.to_dict()), 201
    except ValidationError as err:
        create_notification(
            type_val='WARNING',
            title='Operation Failed Alert',
            message=f"Failed to register supplier due to validation errors."
        )
        db.session.commit()
        return jsonify({"errors": err.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@suppliers_bp.route('/<int:sup_id>', methods=['PUT'])
@jwt_required()
def update_supplier(sup_id):
    try:
        sup = Supplier.query.get_or_404(sup_id)
        data = request.get_json()
        validated_data = supplier_schema.load(data, partial=True)
        
        for field, val in validated_data.items():
            if val is not None:
                setattr(sup, field, val)
                
        create_notification(
            type_val='INFO',
            title='Supplier Profile Modified',
            message=f"Supplier '{sup.name}' has had their contact details updated."
        )

        db.session.commit()
        return jsonify(sup.to_dict()), 200
    except ValidationError as err:
        create_notification(
            type_val='WARNING',
            title='Operation Failed Alert',
            message=f"Failed to update supplier '{sup.name}' due to validation errors."
        )
        db.session.commit()
        return jsonify({"errors": err.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@suppliers_bp.route('/<int:sup_id>', methods=['DELETE'])
@jwt_required()
def delete_supplier(sup_id):
    try:
        sup = Supplier.query.get_or_404(sup_id)
        sup_name = sup.name
        db.session.delete(sup)
        
        create_notification(
            type_val='INFO',
            title='Supplier Removed Alert',
            message=f"Supplier '{sup_name}' was removed from the database."
        )

        db.session.commit()
        return jsonify({"success": True, "message": "Supplier deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
