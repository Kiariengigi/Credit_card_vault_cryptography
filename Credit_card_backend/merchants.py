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
@require_role('admin')
def list_merchants():
    db, cur = get_db()
    cur.execute("SELECT merchant_id, merchant_name AS business_name, contact_email FROM merchants WHERE status='Active'")
    rows = cur.fetchall()
    merchants = [dict(zip([desc[0] for desc in cur.description], r)) for r in rows]
    return jsonify({'merchants': merchants})

@merchants_bp.get('/merchant/customers')
@require_role('merchant')
def get_merchant_customers():
    """Retrieve customers and their card details for the logged-in merchant."""
    try:
        merchant_id = session.get('user_id')
        if not merchant_id:
            return jsonify({"error": "Unauthorized access."}), 401

        db, cur = get_db()
        cur.execute(
            """
            SELECT c.customer_id, c.first_name AS firstname, c.last_name AS lastname,
                   AES_DECRYPT(c.email_enc, %s) AS email, AES_DECRYPT(c.phone_enc, %s) AS phone,
                   cv.card_id, AES_DECRYPT(cv.card_number_enc, %s) AS card_number,
                   AES_DECRYPT(cv.expiry_date_enc, %s) AS expiry_date, AES_DECRYPT(cv.cvv_enc, %s) AS cvv
            FROM customers c
            LEFT JOIN card_vault cv ON c.customer_id = cv.customer_id
            WHERE c.merchant_id = %s AND c.status = 'Active' AND cv.status = 'Active'
            """,
            (AES_KEY, AES_KEY, AES_KEY, AES_KEY, AES_KEY, merchant_id)
        )
        rows = cur.fetchall()
        customers = [dict(zip([desc[0] for desc in cur.description], r)) for r in rows]

        # Decode binary fields returned from AES_DECRYPT
        for customer in customers:
            for k, v in list(customer.items()):
                if isinstance(v, (bytes, bytearray)):
                    try:
                        customer[k] = v.decode('utf-8')
                    except Exception:
                        customer[k] = v.hex()

        return jsonify({'customers': customers})
    except Exception as e:
        return jsonify({"error": str(e)}), 500