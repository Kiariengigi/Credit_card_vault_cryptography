from flask import Blueprint, request, session
from db import get_db
from utils.decorators import require_role
from utils.logger import audit_log

transactions_bp = Blueprint('tx', __name__)

@transactions_bp.post('/charge')
@require_role('admin','merchant')
def charge():
    d = request.json
    db, cur = get_db()
    cur.execute("INSERT INTO transactions (card_id, amount, currency, status) VALUES (%s,%s,%s,'success')",
                (d['card_id'], d['amount'], d.get('currency','USD')))
    db.commit()
    audit_log(session['user_id'], "CHARGE", "transactions")
    return {"message": "charged"}