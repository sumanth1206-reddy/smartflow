from datetime import datetime
from backend.extensions import db

class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), default='INFO')  # WARNING, SALE, INVENTORY, AI, INFO
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    read = db.Column(db.Boolean, default=False, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type,
            "title": self.title,
            "message": self.message,
            "read": self.read,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
