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