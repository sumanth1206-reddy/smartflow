import os
import time
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required
from backend.extensions import db
from backend.models.product import Product
from backend.models.inventory import InventoryItem, StockHistory
from backend.schemas.product import ProductSchema
from backend.middleware.auth import admin_required
from backend.utils.notifications import create_notification
from marshmallow import ValidationError
from werkzeug.utils import secure_filename

products_bp = Blueprint('products', __name__, url_prefix='/products')
product_schema = ProductSchema()
products_list_schema = ProductSchema(many=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@products_bp.route('', methods=['GET'])
def get_products():
    products = Product.query.order_by(Product.id.desc()).all()
    return jsonify([p.to_dict() for p in products]), 200

@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    return jsonify(product.to_dict()), 200

@products_bp.route('', methods=['POST'])
@admin_required
def create_product():
    try:
        data = request.get_json()
        validated_data = product_schema.load(data)
        
        # Check duplicate product name
        if Product.query.filter_by(name=validated_data['name']).first():
            create_notification(
                type_val='WARNING',
                title='Operation Failed Alert',
                message=f"Failed to create product: Product with name '{validated_data['name']}' already exists."
            )
            db.session.commit()
            return jsonify({"error": f"Product with name '{validated_data['name']}' already exists"}), 400
            
        # Check SKU uniqueness
        if Product.query.filter_by(sku=validated_data['sku']).first():
            create_notification(
                type_val='WARNING',
                title='Operation Failed Alert',
                message=f"Failed to create product: Product with SKU '{validated_data['sku']}' already exists."
            )
            db.session.commit()
            return jsonify({"error": f"Product with SKU '{validated_data['sku']}' already exists"}), 400
            
        # Check Barcode uniqueness
        if validated_data.get('barcode'):
            if Product.query.filter_by(barcode=validated_data['barcode']).first():
                create_notification(
                    type_val='WARNING',
                    title='Operation Failed Alert',
                    message=f"Failed to create product: Product with Barcode '{validated_data['barcode']}' already exists."
                )
                db.session.commit()
                return jsonify({"error": f"Product with Barcode '{validated_data['barcode']}' already exists"}), 400
                
        qty = validated_data.get('quantity', 0)
        
        new_product = Product(
            name=validated_data['name'],
            sku=validated_data['sku'],
            category=validated_data.get('category'),
            price=validated_data['price'],
            cost_price=validated_data.get('cost_price'),
            quantity=qty,
            status=validated_data.get('status', 'In Stock'),
            image=validated_data.get('image', '📦'),
            barcode=validated_data.get('barcode'),
            expiry_date=validated_data.get('expiry_date'),
            supplier_id=validated_data.get('supplier_id')
        )
        
        db.session.add(new_product)
        db.session.flush()
        
        # Create corresponding InventoryItem
        new_inv = InventoryItem(
            product_id=new_product.id,
            quantity=qty,
            location='Warehouse A'
        )
        db.session.add(new_inv)
        
        # Log to StockHistory
        new_hist = StockHistory(
            product_id=new_product.id,
            change_amount=qty,
            reason='Initial Entry'
        )
        db.session.add(new_hist)
        
        create_notification(
            type_val='INVENTORY',
            title='New Product Registered',
            message=f"Product '{new_product.name}' was created with {qty} units."
        )

        db.session.commit()
        return jsonify(new_product.to_dict()), 201
    except ValidationError as err:
        create_notification(
            type_val='WARNING',
            title='Operation Failed Alert',
            message=f"Validation errors during product creation."
        )
        db.session.commit()
        return jsonify({"errors": err.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@products_bp.route('/<int:product_id>', methods=['PUT'])
@admin_required
def update_product(product_id):
    try:
        product = Product.query.get_or_404(product_id)
        data = request.get_json()
        validated_data = product_schema.load(data, partial=True)
        
        # Duplicate name validation
        if 'name' in validated_data and validated_data['name'] != product.name:
            if Product.query.filter_by(name=validated_data['name']).first():
                create_notification(
                    type_val='WARNING',
                    title='Operation Failed Alert',
                    message=f"Failed to edit product: Product with name '{validated_data['name']}' already exists."
                )
                db.session.commit()
                return jsonify({"error": f"Product with name '{validated_data['name']}' already exists"}), 400

        # SKU validation for unique check
        if 'sku' in validated_data and validated_data['sku'] != product.sku:
            if Product.query.filter_by(sku=validated_data['sku']).first():
                create_notification(
                    type_val='WARNING',
                    title='Operation Failed Alert',
                    message=f"Failed to edit product: Product with SKU '{validated_data['sku']}' already exists."
                )
                db.session.commit()
                return jsonify({"error": f"Product with SKU '{validated_data['sku']}' already exists"}), 400

        # Barcode validation for unique check
        if 'barcode' in validated_data and validated_data['barcode'] and validated_data['barcode'] != product.barcode:
            if Product.query.filter_by(barcode=validated_data['barcode']).first():
                create_notification(
                    type_val='WARNING',
                    title='Operation Failed Alert',
                    message=f"Failed to edit product: Product with Barcode '{validated_data['barcode']}' already exists."
                )
                db.session.commit()
                return jsonify({"error": f"Product with Barcode '{validated_data['barcode']}' already exists"}), 400

        # Handle quantity changes
        if 'quantity' in validated_data:
            new_qty = validated_data['quantity']
            diff = new_qty - product.quantity
            if diff != 0:
                product.quantity = new_qty
                # Update corresponding InventoryItem (Warehouse A by default)
                inv_item = InventoryItem.query.filter_by(product_id=product.id, location='Warehouse A').first()
                if inv_item:
                    inv_item.quantity = new_qty
                else:
                    inv_item = InventoryItem(product_id=product.id, quantity=new_qty, location='Warehouse A')
                    db.session.add(inv_item)
                
                # Log Stock History
                reason = "Manual Adjustment" if diff > 0 else "System Correction"
                if "reason" in data:
                    reason = data["reason"]
                elif diff > 0 and product.quantity < 20:
                    reason = "Restocked"
                    
                new_hist = StockHistory(
                    product_id=product.id,
                    change_amount=diff,
                    reason=reason
                )
                db.session.add(new_hist)

                create_notification(
                    type_val='INVENTORY',
                    title='Inventory Adjusted',
                    message=f"Product '{product.name}' quantity was adjusted by {diff} units. New level: {product.quantity}."
                )

        # Update other fields
        for field in ['name', 'sku', 'category', 'price', 'cost_price', 'status', 'image', 'barcode', 'expiry_date', 'supplier_id']:
            if field in validated_data:
                setattr(product, field, validated_data[field])
                
        create_notification(
            type_val='INFO',
            title='Product Details Modified',
            message=f"Product '{product.name}' settings/details have been updated by Admin."
        )

        db.session.commit()
        return jsonify(product.to_dict()), 200
    except ValidationError as err:
        create_notification(
            type_val='WARNING',
            title='Operation Failed Alert',
            message=f"Validation errors updating product '{product.name}'."
        )
        db.session.commit()
        return jsonify({"errors": err.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@products_bp.route('/<int:product_id>', methods=['DELETE'])
@admin_required
def delete_product(product_id):
    try:
        product = Product.query.get_or_404(product_id)
        prod_name = product.name
        db.session.delete(product)
        
        create_notification(
            type_val='INFO',
            title='Product Deleted Alert',
            message=f"Product '{prod_name}' was removed from the inventory database."
        )

        db.session.commit()
        return jsonify({"success": True, "message": "Product deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@products_bp.route('/upload-image', methods=['POST'])
@jwt_required()
def upload_image():
    if 'image' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filename = f"{int(time.time())}_{filename}"
        file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))
        image_url = f"/api/products/image/{filename}"
        return jsonify({"success": True, "imageUrl": image_url}), 200
    return jsonify({"error": "Allowed file types are png, jpg, jpeg, gif, webp"}), 400

@products_bp.route('/image/<filename>', methods=['GET'])
def get_uploaded_image(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)
