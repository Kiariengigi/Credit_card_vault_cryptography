import mysql.connector
from mysql.connector import Error

def get_connection():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",          # change if your MySQL username is different
            password="",          # put your MySQL password
            database="crypto_app" # name of your database in phpMyAdmin
        )
        return conn
    except Error as e:
        print("Database connection error:", e)
        return None

def initialize_database():
    try:
        conn = get_connection()
        if conn is None:
            return

        cursor = conn.cursor()

        # Create users table with role column
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                user_id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                user_role ENUM('customer', 'merchant', 'admin') DEFAULT 'customer',
                status VARCHAR(50) DEFAULT 'Active'
            )
            """
        )

        # Create cards table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS cards (
                card_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                card_number VARCHAR(16) NOT NULL,
                expiry_date DATE NOT NULL,
                cvv VARCHAR(3) NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
            """
        )

        conn.commit()
        print("Database initialized successfully.")
    except Error as e:
        print("Error initializing database:", e)
    finally:
        if conn:
            conn.close()
