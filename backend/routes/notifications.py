from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.extensions import db
from backend.models.notification import Notification
from backend.models.product import Product

notifications_bp = Blueprint('notifications', __name__, url_prefix='/notifications')

@notifications_bp.route('', methods=['GET'])
def get_notifications():
    try:
        # Scan for expired products dynamically
        expired_products = Product.query.filter(
            Product.expiry_date.isnot(None), 
            Product.expiry_date < datetime.utcnow()
        ).all()
        
        for prod in expired_products:
            # Check if active unread alert already exists for this expired product
            exists = Notification.query.filter_by(
                type='WARNING',
                title='Product Expired Alert',
                message=f"Product '{prod.name}' has expired as of {prod.expiry_date.strftime('%Y-%m-%d')}!",
                read=False
            ).first()
            
            if not exists:
                new_note = Notification(
                    type='WARNING',
                    title='Product Expired Alert',
                    message=f"Product '{prod.name}' has expired as of {prod.expiry_date.strftime('%Y-%m-%d')}!",
                    read=False
                )
                db.session.add(new_note)
                
        db.session.commit()
    except Exception as scan_err:
        print(f"Error checking product expiry alerts: {scan_err}")
        db.session.rollback()

    # Return all notifications ordered by read status and date
    notifications = Notification.query.order_by(
        Notification.read.asc(), 
        Notification.created_at.desc()
    ).all()
    
    return jsonify([n.to_dict() for n in notifications]), 200

@notifications_bp.route('/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_as_read(notification_id):
    try:
        notification = Notification.query.get_or_404(notification_id)
        notification.read = True
        db.session.commit()
        return jsonify(notification.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
