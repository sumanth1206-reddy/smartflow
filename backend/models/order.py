from datetime import datetime
from backend.extensions import db

class Order(db.Model):
    __tablename__ = 'orders'

    id = db.Column(db.Integer, primary_key=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=False, index=True)
    order_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(50), default='Pending')  # 'Pending', 'Ordered', 'Received', 'Cancelled'
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    supplier = db.relationship('Supplier', backref=db.backref('orders', cascade='all, delete-orphan'))
    items = db.relationship('OrderItem', backref='order', cascade='all, delete-orphan', lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "supplierId": self.supplier_id,
            "supplierName": self.supplier.name if self.supplier else "Unknown",
            "orderDate": self.order_date.isoformat() if self.order_date else '',
            "status": self.status,
            "totalAmount": str(self.total_amount),
            "items": [item.to_dict() for item in self.items]
        }

class OrderItem(db.Model):
    __tablename__ = 'order_items'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False, index=True)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)

    product = db.relationship('Product', back_populates='order_items')

    def to_dict(self):
        return {
            "id": self.id,
            "productId": self.product_id,
            "productName": self.product.name if self.product else "Unknown Product",
            "qty": self.quantity,
            "price": str(self.price),
            "amount": str(self.quantity * self.price)
        }
