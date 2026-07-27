from datetime import datetime
from backend.extensions import db

class InventoryItem(db.Model):
    __tablename__ = 'inventory'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False, index=True)
    quantity = db.Column(db.Integer, default=0, nullable=False)
    location = db.Column(db.String(100), default='Warehouse A')
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "productId": self.product_id,
            "quantity": self.quantity,
            "location": self.location,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class StockHistory(db.Model):
    __tablename__ = 'stock_history'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False, index=True)
    change_amount = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.String(255), nullable=False)  # e.g., "Sale", "Restock", "Manual Adjustment"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    product = db.relationship('Product', backref=db.backref('history_records', cascade='all, delete-orphan'))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "change_amount": self.change_amount,
            "reason": self.reason,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
