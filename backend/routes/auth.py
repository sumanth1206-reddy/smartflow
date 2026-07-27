import re
import uuid
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.user import User
from backend.schemas.user import UserSchema, UserLoginSchema, UserProfileUpdateSchema
from marshmallow import ValidationError

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

user_schema = UserSchema()
login_schema = UserLoginSchema()
profile_update_schema = UserProfileUpdateSchema()

def validate_password_strength(password):
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit."
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character."
    return True, ""

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        validated_data = user_schema.load(data)
        
        # Check if user already exists
        if User.query.filter_by(email=validated_data['email']).first():
            return jsonify({"error": "User with this email already exists"}), 400
            
        password = validated_data.pop('password')
        
        # Validate password strength
        is_valid, err_msg = validate_password_strength(password)
        if not is_valid:
            return jsonify({"error": err_msg}), 400
            
        new_user = User(**validated_data)
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({"success": True, "user": new_user.to_dict()}), 201
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        validated_data = login_schema.load(data)
        
        user = User.query.filter_by(email=validated_data['email']).first()
        if not user or not user.check_password(validated_data['password']):
            return jsonify({"error": "Invalid email or password"}), 401
            
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        return jsonify({
            "success": True,
            "token": access_token,
            "refreshToken": refresh_token,
            "user": user.to_dict()
        }), 200
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/google', methods=['POST'])
def google_login():
    import urllib.request
    import json
    import uuid
    try:
        data = request.get_json()
        id_token = data.get('id_token')
        access_token = data.get('access_token')
        
        if id_token:
            userinfo_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
        elif access_token:
            userinfo_url = f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={access_token}"
        else:
            return jsonify({"error": "Missing access_token or id_token"}), 400
            
        # Verify the token with Google's API
        try:
            req = urllib.request.Request(userinfo_url)
            with urllib.request.urlopen(req) as response:
                google_user = json.loads(response.read().decode('utf-8'))
        except Exception as e:
            return jsonify({"error": f"Invalid Google token: {str(e)}"}), 401
            
        email = google_user.get('email')
        name = google_user.get('name')
        if not email:
            return jsonify({"error": "Google account does not have an email address"}), 400
            
        # Check if user already exists
        user = User.query.filter_by(email=email).first()
        if not user:
            # Create user if it doesn't exist
            user = User(
                email=email,
                name=name or email.split('@')[0],
                role='Cashier'  # Default role for new Google signups
            )
            # Set a random password hash since password is required
            random_password = str(uuid.uuid4())
            user.set_password(random_password)
            db.session.add(user)
            db.session.commit()
            
        access_token_jwt = create_access_token(identity=str(user.id))
        refresh_token_jwt = create_refresh_token(identity=str(user.id))
        
        return jsonify({
            "success": True,
            "token": access_token_jwt,
            "refreshToken": refresh_token_jwt,
            "user": user.to_dict()
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        data = request.get_json()
        validated_data = profile_update_schema.load(data)
        
        # If updating password
        if 'password' in validated_data:
            new_pass = validated_data['password']
            is_valid, err_msg = validate_password_strength(new_pass)
            if not is_valid:
                return jsonify({"error": err_msg}), 400
            user.set_password(new_pass)
        else:
            # Update other profile fields
            for key, val in validated_data.items():
                if val is not None:
                    setattr(user, key, val)
                    
        db.session.commit()
        
        return jsonify({
            "success": True,
            "user": user.to_dict()
        }), 200
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json()
        email = data.get('email')
        if not email:
            return jsonify({"error": "Email is required"}), 400
            
        user = User.query.filter_by(email=email).first()
        if not user:
            # Standard security practice: return success anyway to prevent user enumeration
            return jsonify({"success": True, "message": "If this email exists in our records, a recovery code has been sent."}), 200
            
        token = str(uuid.uuid4().hex[:6]).upper()
        user.reset_token = token
        user.reset_token_expiry = datetime.utcnow() + timedelta(minutes=15)
        db.session.commit()
        
        print(f"==================================================")
        print(f"PASSWORD RESET REQUEST FOR USER: {email}")
        print(f"RESET CODE: {token}")
        print(f"==================================================")
        
        return jsonify({
            "success": True, 
            "message": "A recovery code has been generated.",
            "dev_sim_code": token
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        token = data.get('token')
        new_password = data.get('password')
        
        if not token or not new_password:
            return jsonify({"error": "Reset token and new password are required"}), 400
            
        user = User.query.filter_by(reset_token=token).first()
        if not user or user.reset_token_expiry < datetime.utcnow():
            return jsonify({"error": "Invalid or expired reset token"}), 400
            
        is_valid, err_msg = validate_password_strength(new_password)
        if not is_valid:
            return jsonify({"error": err_msg}), 400
            
        user.set_password(new_password)
        user.reset_token = None
        user.reset_token_expiry = None
        db.session.commit()
        
        return jsonify({"success": True, "message": "Password has been successfully reset"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    new_access_token = create_access_token(identity=identity)
    return jsonify({"token": new_access_token}), 200
