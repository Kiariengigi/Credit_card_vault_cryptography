import mysql.connector
from flask import g 
from config import DB_CONFIG

def get_db():
    if 'db' not in g:
        g.db = mysql.connector.connect(**DB_CONFIG, autocommit=False)
        g.cursor = g.db.cursor(buffered=True)
    return g.db, g.cursor

def close_db(e=None):
    db = g.pop("db", None)
    cursor = g.pop("cursor", None)
    if cursor: cursor.close()
    if db: db.close()

