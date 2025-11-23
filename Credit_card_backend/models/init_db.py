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
