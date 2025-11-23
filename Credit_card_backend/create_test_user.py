from app import app
from auth import hash_password
from db import get_db

with app.app_context():
    db, cur = get_db()

    # Create test user
    username = "admin"
    password = "admin123"
    email = "admin@test.com"
    role = "admin"
    hashed = hash_password(password)

    try:
        cur.execute(
            "INSERT INTO users (username, email, password_hash, user_role, status) VALUES (%s, %s, %s, %s, 'Active')",
            (username, email, hashed, role)
        )
        db.commit()
        print("Test user created successfully!")
        print(f"Username: {username}")
        print(f"Password: {password}")
    except Exception as e:
        print(f"Error: {e}")
