from datetime import datetime
from backend.extensions import db

class Sale(db.Model):
    __tablename__ = 'sales'

    id = db.Column(db.String(50), primary_key=True)  # e.g., "INV-1001"
    customer = db.Column(db.String(255), default='Walk-in Customer')
    date = db.Column(db.DateTime, default=datetime.utcnow)
    total = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(50), default='Paid')  # 'Paid', 'Pending'
    payment_method = db.Column(db.String(50), default='Cash')  # 'Cash', 'Card', 'UPI'
    email = db.Column(db.String(255), nullable=True)
    subtotal = db.Column(db.Numeric(10, 2), nullable=True, default=0.0)
    tax = db.Column(db.Numeric(10, 2), nullable=True, default=0.0)
    discount = db.Column(db.Numeric(10, 2), nullable=True, default=0.0)
    phone = db.Column(db.String(50), nullable=True)
    address = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    items = db.relationship('SaleItem', backref='sale', cascade='all, delete-orphan', lazy=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "customer": self.customer,
            "date": self.date.strftime('%Y-%m-%d %H:%M') if self.date else '',
            "total": str(self.total),
            "status": self.status,
            "paymentMethod": self.payment_method,
            "email": self.email,
            "subtotal": str(self.subtotal) if self.subtotal is not None else "0.00",
            "tax": str(self.tax) if self.tax is not None else "0.00",
            "discount": str(self.discount) if self.discount is not None else "0.00",
            "phone": self.phone,
            "address": self.address,
            "items": [item.to_dict() for item in self.items]
        }

class SaleItem(db.Model):
    __tablename__ = 'sale_items'

    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.String(50), db.ForeignKey('sales.id'), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False, index=True)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)

    product = db.relationship('Product', back_populates='sale_items')

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.product_id,
            "item": self.product.name if self.product else "Unknown Item",
            "qty": self.quantity,
            "price": str(self.price),
            "amount": str(self.amount)
        }
