from db import db, cursor
from auth import hash_password

def login(username, password):
    hashed = hash_password(password)

    sql = """
        SELECT user_id, user_role, status
        FROM users
        WHERE username = %s AND password_hash = %s
    """

    cursor.execute(sql, (username, hashed))
    user = cursor.fetchone()

    if not user: 
        print("Invalid Username or Password")
        return None
    
    user_id, role, status = user

    if status != "Active":
        print(" Account is either Inactive, suspended or unverified")
        return None
    
    cursor.execute("UPDATE users SET last_login = NOW() WHERE user_id = %s", (user_id))
    db.commit()

    print("Login successful. Role:", role)
    return{"user_id": user_id, "role":role}


