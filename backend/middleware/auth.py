from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from backend.models.user import User

def roles_required(*roles):
    """
    Decorator to restrict access to users with specific roles.
    Example: @roles_required('Admin', 'Operations Manager')
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
                user_id = int(get_jwt_identity())
                user = User.query.get(user_id)
                if not user:
                    return jsonify({"error": "User not found"}), 404
                if user.role not in roles:
                    return jsonify({"error": f"Role '{user.role}' is not authorized to access this resource"}), 403
                return fn(*args, **kwargs)
            except Exception as e:
                return jsonify({"error": str(e)}), 401
        return wrapper
    return decorator

def admin_required(fn):
    """
    Shortcut decorator for Admin-only routes.
    """
    return roles_required('Admin')(fn)
