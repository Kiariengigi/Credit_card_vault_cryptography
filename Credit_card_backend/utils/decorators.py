from functools import wraps 
from flask import session, jsonify

def require_role(*roles):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({"error": "Login required"}), 401
            user_role = session.get('user_role', '').lower()
            allowed_roles = [r.lower() for r in roles]
            if user_role not in allowed_roles: 
                return jsonify({"error": "You're not allowed here!"}), 403
            return f(*args, **kwargs)
        return wrapper 
    return decorator