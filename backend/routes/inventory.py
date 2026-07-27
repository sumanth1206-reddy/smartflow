from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.extensions import db
from backend.models.inventory import InventoryItem, StockHistory
from backend.models.product import Product
from backend.models.settings import Settings
from backend.schemas.inventory import InventoryItemSchema, InventoryAdjustmentSchema
from marshmallow import ValidationError

inventory_bp = Blueprint('inventory', __name__, url_prefix='/inventory')
inventory_item_schema = InventoryItemSchema()

@inventory_bp.route('', methods=['GET'])
def get_inventory():
    items = InventoryItem.query.all()
    return jsonify([item.to_dict() for item in items]), 200

@inventory_bp.route('/adjust', methods=['POST'])
@jwt_required()
def adjust_inventory():
    try:
        data = request.get_json()
        validated_data = InventoryAdjustmentSchema().load(data)
        
        prod_id = validated_data['productId']
        adjust_qty = validated_data['quantity']  # new total quantity or diff? Let's make it the new total or diff. Let's make it diff.
        location = validated_data.get('location', 'Warehouse A')
        reason = validated_data['reason']
        
        product = Product.query.get_or_404(prod_id)
        
        # Find or create inventory item
        inv_item = InventoryItem.query.filter_by(product_id=prod_id, location=location).first()
        if not inv_item:
            inv_item = InventoryItem(product_id=prod_id, quantity=0, location=location)
            db.session.add(inv_item)
            
        old_qty = inv_item.quantity
        inv_item.quantity = adjust_qty  # Set new quantity
        
        # Calculate diff to update Product quantity
        diff = adjust_qty - old_qty
        product.quantity += diff
        
        # Update product status
        settings = Settings.query.filter_by(id=1).first()
        low_stock_limit = settings.low_stock_threshold if settings else 10
        if product.quantity == 0:
            product.status = 'Out of Stock'
        elif product.quantity < low_stock_limit:
            product.status = 'Low Stock'
        else:
            product.status = 'In Stock'
            
        # Log to StockHistory
        new_hist = StockHistory(
            product_id=prod_id,
            change_amount=diff,
            reason=reason
        )
        db.session.add(new_hist)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Inventory adjusted successfully",
            "inventoryItem": inv_item.to_dict(),
            "product": product.to_dict()
        }), 200
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
