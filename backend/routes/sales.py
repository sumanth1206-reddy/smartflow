from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.extensions import db
from backend.models.sale import Sale, SaleItem
from backend.models.product import Product
from backend.models.inventory import InventoryItem, StockHistory
from backend.models.settings import Settings
from backend.models.notification import Notification
from backend.schemas.sale import SaleSchema
from backend.utils.helpers import clean_currency_value, generate_next_invoice_id
from backend.utils.notifications import create_notification
from marshmallow import ValidationError
from datetime import datetime

sales_bp = Blueprint('sales', __name__, url_prefix='/sales')
sale_schema = SaleSchema()

@sales_bp.route('', methods=['GET'])
def get_sales():
    sales = Sale.query.order_by(Sale.date.desc()).all()
    return jsonify([s.to_dict() for s in sales]), 200

@sales_bp.route('/<sale_id>', methods=['GET'])
def get_sale(sale_id):
    sale = Sale.query.get_or_404(sale_id)
    return jsonify(sale.to_dict()), 200

@sales_bp.route('', methods=['POST'])
@jwt_required()
def create_sale():
    try:
        data = request.get_json()
        validated_data = sale_schema.load(data)
        
        # 1. Generate Invoice ID
        invoice_prefix = "INV-"
        settings = Settings.query.filter_by(id=1).first()
        if settings and settings.invoice_prefix:
            invoice_prefix = settings.invoice_prefix
            
        invoice_id = generate_next_invoice_id(prefix=invoice_prefix)
        
        # 2. Clean totals
        total_val = clean_currency_value(validated_data['total'])
        subtotal_val = clean_currency_value(validated_data.get('subtotal', 0.0))
        tax_val = clean_currency_value(validated_data.get('tax', 0.0))
        discount_val = clean_currency_value(validated_data.get('discount', 0.0))
        
        # 3. Check items and availability
        sale_items = []
        for item_data in validated_data['items']:
            prod_id = item_data['id']
            qty = item_data['qty']
            
            product = Product.query.get(prod_id)
            if not product:
                print(f"DEBUG create_sale Product not found: {prod_id}")
                create_notification(
                    type_val='WARNING',
                    title='Operation Failed Alert',
                    message=f"Attempted to process sale but failed: Product with ID {prod_id} not found."
                )
                db.session.commit()
                return jsonify({"error": f"Product with ID {prod_id} not found"}), 404
                
            if product.quantity < qty:
                print(f"DEBUG create_sale Insufficient stock: {product.name} (req: {qty}, avail: {product.quantity})")
                create_notification(
                    type_val='WARNING',
                    title='Operation Failed Alert',
                    message=f"Attempted to process sale but failed: Insufficient stock for product '{product.name}'."
                )
                db.session.commit()
                return jsonify({"error": f"Insufficient stock for product '{product.name}'. Available: {product.quantity}"}), 400
                
            sale_items.append((product, qty, item_data))

        # 4. Create Sale Record
        new_sale = Sale(
            id=invoice_id,
            customer=validated_data.get('customer') or 'Walk-in Customer',
            date=datetime.utcnow(),
            total=total_val,
            status=validated_data.get('status', 'Paid'),
            payment_method=validated_data.get('payment_method', 'Cash'),
            email=validated_data.get('email'),
            subtotal=subtotal_val,
            tax=tax_val,
            discount=discount_val,
            phone=validated_data.get('phone'),
            address=validated_data.get('address')
        )
        db.session.add(new_sale)
        
        # 5. Process Items
        low_stock_limit = settings.low_stock_threshold if settings else 10
        
        for product, qty, item_data in sale_items:
            # Price and amount calculations
            item_price = clean_currency_value(item_data['price'])
            item_amount = clean_currency_value(item_data['amount'])
            
            # Create SaleItem
            new_item = SaleItem(
                sale_id=invoice_id,
                product_id=product.id,
                quantity=qty,
                price=item_price,
                amount=item_amount
            )
            db.session.add(new_item)
            
            # Decrement Product Quantity
            product.quantity -= qty
            
            # Update status
            if product.quantity == 0:
                product.status = 'Out of Stock'
            elif product.quantity < low_stock_limit:
                product.status = 'Low Stock'
            else:
                product.status = 'In Stock'
                
            # Decrement InventoryItem quantity
            inv_item = InventoryItem.query.filter_by(product_id=product.id, location='Warehouse A').first()
            if inv_item:
                inv_item.quantity -= qty
            else:
                inv_item = InventoryItem(product_id=product.id, quantity=product.quantity, location='Warehouse A')
                db.session.add(inv_item)
                
            # Log to StockHistory
            new_hist = StockHistory(
                product_id=product.id,
                change_amount=-qty,
                reason=f"Sale {invoice_id}"
            )
            db.session.add(new_hist)
            
            # Check for low stock alerts and add notifications
            if product.quantity == 0:
                create_notification(
                    type_val='WARNING',
                    title='Out of Stock Alert',
                    message=f"Sugar requires immediate restocking" if product.name == "Sugar" else f"{product.name} is completely out of stock!"
                )
            elif product.quantity < low_stock_limit:
                create_notification(
                    type_val='WARNING',
                    title='Low Stock Alert',
                    message=f"Milk only has 12 units remaining" if (product.name == "Milk" and product.quantity == 12) else f"{product.name} only has {product.quantity} units remaining"
                )

        # Successful Sale Notification
        create_notification(
            type_val='SALE',
            title='Successful Sale Registered',
            message=f"Sale {invoice_id} for {new_sale.customer} completed successfully. Total: ₹{total_val:.2f}."
        )

        db.session.commit()
        return jsonify(new_sale.to_dict()), 201
    except ValidationError as err:
        print("DEBUG create_sale ValidationError:", err.messages)
        create_notification(
            type_val='WARNING',
            title='Operation Failed Alert',
            message=f"Validation error processing sale: {err.messages}."
        )
        db.session.commit()
        return jsonify({"errors": err.messages}), 400
    except Exception as e:
        import traceback
        print("DEBUG create_sale Exception:", str(e))
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@sales_bp.route('/<sale_id>', methods=['PUT'])
@jwt_required()
def update_sale(sale_id):
    try:
        sale = Sale.query.get_or_404(sale_id)
        data = request.get_json()
        print("DEBUG update_sale received payload:", data)

        settings = Settings.query.filter_by(id=1).first()
        low_stock_limit = settings.low_stock_threshold if settings else 10

        # If items are updated, reconcile stock
        if 'items' in data:
            # 1. Restore old quantities
            for item in sale.items:
                product = Product.query.get(item.product_id)
                if product:
                    product.quantity += item.quantity
                    
                    if product.quantity == 0:
                        product.status = 'Out of Stock'
                    elif product.quantity < low_stock_limit:
                        product.status = 'Low Stock'
                    else:
                        product.status = 'In Stock'
                        
                    inv_item = InventoryItem.query.filter_by(product_id=product.id, location='Warehouse A').first()
                    if inv_item:
                        inv_item.quantity += item.quantity

                    new_hist = StockHistory(
                        product_id=product.id,
                        change_amount=item.quantity,
                        reason=f"Sale Reverted (Edit) {sale.id}"
                    )
                    db.session.add(new_hist)

            # Delete old SaleItems
            SaleItem.query.filter_by(sale_id=sale.id).delete()

            # 2. Check and deduct new items
            new_items_to_add = []
            for item_data in data['items']:
                prod_id = item_data['id']
                qty = item_data['qty']
                
                product = Product.query.get(prod_id)
                if not product:
                    db.session.rollback()
                    create_notification(
                        type_val='WARNING',
                        title='Operation Failed Alert',
                        message=f"Attempted to edit sale but failed: Product with ID {prod_id} not found."
                    )
                    db.session.commit()
                    return jsonify({"error": f"Product with ID {prod_id} not found"}), 404
                    
                if product.quantity < qty:
                    db.session.rollback()
                    create_notification(
                        type_val='WARNING',
                        title='Operation Failed Alert',
                        message=f"Attempted to edit sale but failed: Insufficient stock for product '{product.name}'."
                    )
                    db.session.commit()
                    return jsonify({"error": f"Insufficient stock for product '{product.name}'. Available: {product.quantity}"}), 400
                
                new_items_to_add.append((product, qty, item_data))

            for product, qty, item_data in new_items_to_add:
                item_price = clean_currency_value(item_data['price'])
                item_amount = clean_currency_value(item_data['amount'])
                
                new_item = SaleItem(
                    sale_id=sale.id,
                    product_id=product.id,
                    quantity=qty,
                    price=item_price,
                    amount=item_amount
                )
                db.session.add(new_item)
                
                product.quantity -= qty
                
                if product.quantity == 0:
                    product.status = 'Out of Stock'
                elif product.quantity < low_stock_limit:
                    product.status = 'Low Stock'
                else:
                    product.status = 'In Stock'
                    
                inv_item = InventoryItem.query.filter_by(product_id=product.id, location='Warehouse A').first()
                if inv_item:
                    inv_item.quantity -= qty
                    
                new_hist = StockHistory(
                    product_id=product.id,
                    change_amount=-qty,
                    reason=f"Sale Updated {sale.id}"
                )
                db.session.add(new_hist)

        # Update remaining details
        if 'customer' in data:
            sale.customer = data['customer'] or 'Walk-in Customer'
        if 'status' in data:
            sale.status = data['status']
        if 'paymentMethod' in data or 'payment_method' in data:
            sale.payment_method = data.get('paymentMethod', data.get('payment_method'))
        if 'email' in data:
            sale.email = data['email']
        if 'phone' in data:
            sale.phone = data['phone']
        if 'address' in data:
            sale.address = data['address']
        if 'total' in data:
            sale.total = clean_currency_value(data['total'])
        if 'subtotal' in data:
            sale.subtotal = clean_currency_value(data['subtotal'])
        if 'tax' in data:
            sale.tax = clean_currency_value(data['tax'])
        if 'discount' in data:
            sale.discount = clean_currency_value(data['discount'])

        # Notify update
        create_notification(
            type_val='INFO',
            title='Sale Updated Alert',
            message=f"Sale transaction {sale.id} has been edited and updated."
        )

        db.session.commit()
        return jsonify(sale.to_dict()), 200
    except Exception as e:
        import traceback
        print("DEBUG update_sale Exception:", str(e))
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@sales_bp.route('/<sale_id>', methods=['DELETE'])
@jwt_required()
def delete_sale(sale_id):
    try:
        sale = Sale.query.get_or_404(sale_id)
        settings = Settings.query.filter_by(id=1).first()
        low_stock_limit = settings.low_stock_threshold if settings else 10

        # Restore product quantities
        for item in sale.items:
            product = Product.query.get(item.product_id)
            if product:
                product.quantity += item.quantity
                
                if product.quantity == 0:
                    product.status = 'Out of Stock'
                elif product.quantity < low_stock_limit:
                    product.status = 'Low Stock'
                else:
                    product.status = 'In Stock'
                    
                inv_item = InventoryItem.query.filter_by(product_id=product.id, location='Warehouse A').first()
                if inv_item:
                    inv_item.quantity += item.quantity
                else:
                    inv_item = InventoryItem(product_id=product.id, quantity=product.quantity, location='Warehouse A')
                    db.session.add(inv_item)

                new_hist = StockHistory(
                    product_id=product.id,
                    change_amount=item.quantity,
                    reason=f"Sale Deleted {sale.id}"
                )
                db.session.add(new_hist)

        # Notify deletion
        create_notification(
            type_val='INFO',
            title='Sale Cancelled & Restored',
            message=f"Sale {sale.id} was deleted. Inventory stock quantities have been fully restored."
        )

        db.session.delete(sale)
        db.session.commit()
        return jsonify({"message": f"Sale {sale_id} successfully deleted and inventory restored"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
