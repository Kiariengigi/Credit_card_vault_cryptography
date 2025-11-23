import hashlib
from ..config import AES_KEY

def sha256_hash(text):
    return hashlib.sha256(text.encode()).hexdigest()