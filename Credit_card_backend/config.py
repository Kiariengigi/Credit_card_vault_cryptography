import os
from dotenv import load_dotenv
load_dotenv()

DB_CONFIG = {
    "host": os.getenv('DB_HOST', 'localhost'),
    "user": os.getenv('DB_USER', 'root'),
    "password": os.getenv('DB_PASS', ''),
    "database": os.getenv('DB_NAME', 'credit_card_vault'),
    "port": os.getenv('PORT', '5000')
}

AES_KEY = os.getenv("AES_KEY", "2864bcef5d960f9248b5775473bdada01e845114c0bf31c409199c753cb9e57e")
SECRET_KEY = os.getenv("FLASK_SECRET", "a792e2e9ea07d4c87f30f34dffc997b5")