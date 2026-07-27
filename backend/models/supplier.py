from datetime import datetime
from backend.extensions import db

class Supplier(db.Model):
    __tablename__ = 'suppliers'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, index=True)
    contact_name = db.Column(db.String(255), nullable=True)
    email = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    address = db.Column(db.Text, nullable=True)
    history = db.Column(db.Text, nullable=True)  # Store summary of supplier interaction

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "contactName": self.contact_name,
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            "history": self.history,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
