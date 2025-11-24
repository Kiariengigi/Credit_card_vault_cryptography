import os
from flask import Flask, request, session, jsonify
from auth import auth_bp, hash_password
from merchants import merchants_bp
from customers import customers_bp
from cards import cards_bp
from transactions import transactions_bp
from audit import audit_bp
from flask_cors import CORS
from db import get_db

from config import SECRET_KEY

app = Flask(__name__)
app.secret_key = SECRET_KEY
app.config.update({
    'SESSION_COOKIE_SAMESITE': 'Lax',
    'SESSION_COOKIE_HTTPONLY': True,
    'SESSION_COOKIE_SECURE': False
})

# Configure CORS
CORS(app, 
     supports_credentials=True,
     origins=["https://credit-card-vault-cryptography-1.onrender.com", "https://credit-card-vault-cryptography.onrender.com"],
     allow_headers=["Content-Type", "Authorization"],
     expose_headers=["Content-Type"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(merchants_bp)
app.register_blueprint(customers_bp)
app.register_blueprint(cards_bp)
app.register_blueprint(transactions_bp)
app.register_blueprint(audit_bp)

@app.route('/')
def home():
    return {"message": "Vault backend running"}

@app.post('/login')
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400
    
    try:
        db, cur = get_db()
        hashed = hash_password(password)
        cur.execute(
            "SELECT user_id, user_role, status FROM users WHERE username = %s AND password_hash = %s",
            (username, hashed)
        )
        user = cur.fetchone()
        
        if not user:
            return jsonify({"error": "Invalid username or password"}), 401
        
        user_id, role, status = user
        
        if status != "Active":
            return jsonify({"error": "Account is inactive or suspended"}), 403
        
        session['user_id'] = user_id
        session['user_role'] = role
        session['username'] = username
        
        return jsonify({"message": "Login successful", "user_id": user_id, "role": role}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.post('/logout')
def logout():
    session.clear()
    return jsonify({"message": "Logged out"}), 200

@app.get('/session/check')
def check_session():
    if 'user_id' in session:
        return jsonify({
            "logged_in": True,
            "user_id": session.get('user_id'),
            "user_role": session.get('user_role'),
            "username": session.get('username')
        }), 200
    return jsonify({"logged_in": False}), 401

@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    if origin and any(origin.startswith(allowed) for allowed in ["http://localhost", "http://127.0.0.1"]):
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

@app.teardown_appcontext
def close_db(error):
    from db import close_db as close_db_func
    close_db_func(error)

# ONLY run when executing locally
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
