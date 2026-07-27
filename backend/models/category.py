from datetime import datetime
from backend.extensions import db

class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        # We can dynamically count products belonging to this category
        from backend.models.product import Product
        product_count = Product.query.filter_by(category=self.name).count()
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "productCount": product_count,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
