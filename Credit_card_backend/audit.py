from flask import Blueprint
from utils.decorators import require_role
from db import get_db

audit_bp = Blueprint('audit', __name__)

@audit_bp.get('/audit')
@require_role('admin')
def audit_logs():
    db, cur = get_db()
    cur.execute("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100")
    return {"logs": cur.fetchall()}