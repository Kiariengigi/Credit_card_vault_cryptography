from flask import Blueprint, request, session, jsonify
from db import get_db
from utils.decorators import require_role
from utils.logger import audit_log

merchants_bp = Blueprint('merchants', __name__)

@merchants_bp.post('/merchant/create')
@require_role('admin')
def create_merchant():
    data = request.json
    db, cur = get_db()
    cur.execute("INSERT INTO merchants (merchant_name,contact_email, status) VALUES (%s,%s, 'Active')",
                (data['name'], data['email']))
    db.commit()
    audit_log(session['user_id'], "CREATE_MERCHANT", "merchants")
    return {"message": "merchant created"}

@merchants_bp.get('/merchant/list')
@require_role('admin','merchant')
def list_merchants():
    db, cur = get_db()
    cur.execute("SELECT merchant_id, merchant_name AS business_name, contact_email FROM merchants WHERE status='Active'")
    rows = cur.fetchall()
    merchants = [dict(zip([desc[0] for desc in cur.description], r)) for r in rows]
    return jsonify({'merchants': merchants})