import os
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()

# Support either individual DB env vars or a single DATABASE_URL
database_url = os.getenv('DATABASE_URL')
if database_url:
    # expected format: mysql://user:pass@host:port/dbname
    parsed = urlparse(database_url)
    DB_HOST = parsed.hostname
    DB_USER = parsed.username
    DB_PASS = parsed.password
    DB_NAME = parsed.path.lstrip('/') if parsed.path else os.getenv('DB_NAME', 'credit_card_vault')
    DB_PORT = parsed.port or int(os.getenv('DB_PORT', 3306))
else:
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASS = os.getenv('DB_PASS', '')
    DB_NAME = os.getenv('DB_NAME', 'credit_card_vault')
    # Use DB_PORT (not generic PORT used by web server)
    DB_PORT = int(os.getenv('DB_PORT', 3306))

# Optional SSL CA path (if your DB requires TLS)
DB_SSL_CA = os.getenv('DB_SSL_CA')

DB_CONFIG = {
    "host": DB_HOST,
    "user": DB_USER,
    "password": DB_PASS,
    "database": DB_NAME,
    "port": DB_PORT
}

if DB_SSL_CA:
    DB_CONFIG['ssl_ca'] = DB_SSL_CA

# Debug-friendly non-secret info (printed by app when starting)
SAFE_DB_INFO = {
    'host': DB_HOST,
    'port': DB_PORT,
    'database': DB_NAME,
    'user': DB_USER
}

AES_KEY = os.getenv("AES_KEY", "2864bcef5d960f9248b5775473bdada01e845114c0bf31c409199c753cb9e57e")
SECRET_KEY = os.getenv("FLASK_SECRET", os.getenv('SECRET_KEY', "a792e2e9ea07d4c87f30f34dffc997b5"))