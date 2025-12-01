import os
import time
from flask import Flask, request, session, jsonify
from auth import auth_bp, hash_password
from merchants import merchants_bp
from customers import customers_bp
from cards import cards_bp
from transactions import transactions_bp
from audit import audit_bp
from flask_cors import CORS
from db import get_db

from config import SECRET_KEY, SAFE_DB_INFO

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


@app.route('/dbtest')
def dbtest():
    """Attempt a short DB connect and return diagnostic info."""
    try:
        # use the DB connect timeout from env (db.get_db already uses DB_CONNECT_TIMEOUT)
        db, cur = get_db()
        cur.execute("SELECT 1")
        _ = cur.fetchone()
        return {"db": "ok", "db_info": SAFE_DB_INFO}, 200
    except Exception as e:
        # Return a short error message and log full exception server-side
        print(f"[DBTEST] error connecting to DB: {e}")
        return {"db": "error", "error": str(e), "db_info": SAFE_DB_INFO}, 500

@app.post('/login')
def login():
    start = time.time()
    data = request.json
    username = data.get('username') if data else None
    password = data.get('password') if data else None

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    try:
        t_connect_start = time.time()
        db, cur = get_db()
        t_connect_end = time.time()

        t_query_start = time.time()
        hashed = hash_password(password)
        cur.execute(
            "SELECT user_id, user_role, status FROM users WHERE username = %s AND password_hash = %s",
            (username, hashed)
        )
        user = cur.fetchone()
        t_query_end = time.time()

        if not user:
            total = time.time() - start
            print(f"[LOGIN] failed auth for {username} — total={total:.3f}s, connect={(t_connect_end-t_connect_start):.3f}s, query={(t_query_end-t_query_start):.3f}s")
            resp = jsonify({"error": "Invalid username or password", "timings": {
                "total_s": total,
                "db_connect_s": (t_connect_end - t_connect_start),
                "db_query_s": (t_query_end - t_query_start)
            }})
            resp.status_code = 401
            resp.headers['X-Debug-Timings'] = str(total)
            return resp

        user_id, role, status = user

        if status != "Active":
            total = time.time() - start
            print(f"[LOGIN] inactive account {username} — total={total:.3f}s")
            resp = jsonify({"error": "Account is inactive or suspended", "timings": {"total_s": total}})
            resp.status_code = 403
            resp.headers['X-Debug-Timings'] = str(total)
            return resp

        session['user_id'] = user_id
        session['user_role'] = role
        session['username'] = username

        total = time.time() - start
        print(f"[LOGIN] success {username} id={user_id} role={role} — total={total:.3f}s, connect={(t_connect_end-t_connect_start):.3f}s, query={(t_query_end-t_query_start):.3f}s")
        resp = jsonify({"message": "Login successful", "user_id": user_id, "role": role, "timings": {
            "total_s": total,
            "db_connect_s": (t_connect_end - t_connect_start),
            "db_query_s": (t_query_end - t_query_start)
        }})
        resp.status_code = 200
        resp.headers['X-Debug-Timings'] = str(total)
        return resp
    except Exception as e:
        total = time.time() - start
        print(f"[LOGIN] error for {username if username else 'unknown'} — {e} — total={total:.3f}s")
        resp = jsonify({"error": str(e), "timings": {"total_s": total}})
        resp.status_code = 500
        resp.headers['X-Debug-Timings'] = str(total)
        return resp

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
