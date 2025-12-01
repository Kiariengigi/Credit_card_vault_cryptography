import hashlib
from db import get_db

from flask import Blueprint



def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def register_user(username, email, password, role='customer'):
    hashed = hash_password(password)
    sql = """
        INSERT INTO users (username, email, password_hash, user_role) VALUES (%s,%s,%s,%s)
        """
    
    try: 
        db, cursor = get_db()
        cursor.execute(sql, (username, email, hashed, role))
        db.commit()
        print("User registered successfully")
    except Exception as e: 
        print("Error: ", e)

auth_bp = Blueprint('auth', __name__)


from flask import request, jsonify


@auth_bp.route('/register', methods=['POST'])
def register_route():
    data = request.json or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'customer').lower()

    if not username or not email or not password:
        return jsonify({'error': 'username, email, and password are required'}), 400

    if role not in ['customer', 'merchant']:
        return jsonify({'error': 'Invalid role. Only "customer" or "merchant" roles are allowed.'}), 400

    try:
        db, cur = get_db()
        # Check if username or email already exists
        cur.execute("SELECT user_id FROM users WHERE username = %s OR email = %s", (username, email))
        if cur.fetchone():
            return jsonify({'error': 'username or email already exists'}), 409

        hashed = hash_password(password)
        cur.execute(
            "INSERT INTO users (username, email, password_hash, user_role, status) VALUES (%s, %s, %s, %s, %s)",
            (username, email, hashed, role, 'Active')
        )
        db.commit()
        return jsonify({'message': 'User registered successfully'}), 201
    except Exception as e:
        print(f"[REGISTER] error: {e}")
        return jsonify({'error': str(e)}), 500