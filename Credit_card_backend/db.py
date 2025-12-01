import os
import mysql.connector
from mysql.connector import Error as MySQLError
from flask import g
from config import DB_CONFIG


def get_db():
    if 'db' not in g:
        # Allow configuring a short DB connect timeout to fail fast in cloud environments
        timeout = int(os.environ.get('DB_CONNECT_TIMEOUT', 5))
        try:
            conn_args = dict(DB_CONFIG)
            # mysql.connector supports 'connection_timeout' parameter
            conn_args['connection_timeout'] = timeout
            g.db = mysql.connector.connect(**conn_args, autocommit=False)
            g.cursor = g.db.cursor(buffered=True)
        except MySQLError as e:
            # Log and re-raise so the request handler can capture this and return an error
            print(f"[DB] connection error (timeout={timeout}s): {e}")
            raise
    return g.db, g.cursor


def close_db(e=None):
    cursor = g.pop("cursor", None)
    if cursor:
        try:
            cursor.close()
        except Exception:
            pass
    db = g.pop("db", None)
    if db:
        try:
            db.close()
        except Exception:
            pass
