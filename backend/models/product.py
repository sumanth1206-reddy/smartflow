from datetime import datetime
from backend.extensions import db

class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, index=True)
    sku = db.Column(db.String(100), unique=True, nullable=False, index=True)
    category = db.Column(db.String(100), nullable=True)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    cost_price = db.Column(db.Numeric(10, 2), nullable=True)
    quantity = db.Column(db.Integer, default=0, nullable=False)
    status = db.Column(db.String(50), default='In Stock')
    image = db.Column(db.String(255), default='📦')
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # New fields
    barcode = db.Column(db.String(100), unique=True, nullable=True)
    expiry_date = db.Column(db.DateTime, nullable=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=True, index=True)

    # Relationships
    inventory_items = db.relationship('InventoryItem', backref='product', cascade='all, delete-orphan', lazy=True)
    sale_items = db.relationship('SaleItem', back_populates='product', cascade='all, delete-orphan', lazy=True)
    order_items = db.relationship('OrderItem', back_populates='product', cascade='all, delete-orphan', lazy=True)
    supplier = db.relationship('Supplier', backref=db.backref('products', lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "sku": self.sku,
            "category": self.category,
            "price": str(self.price) if self.price is not None else "0.00",
            "costPrice": str(self.cost_price) if self.cost_price is not None else "",
            "quantity": self.quantity,
            "status": self.status,
            "image": self.image,
            "barcode": self.barcode,
            "expiryDate": self.expiry_date.isoformat() if self.expiry_date else None,
            "supplierId": self.supplier_id,
            "supplierName": self.supplier.name if self.supplier else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
