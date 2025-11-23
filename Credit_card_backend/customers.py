from flask import Blueprint, request, session, jsonify
from db import get_db
from utils.decorators import require_role
from utils.logger import audit_log
from config import AES_KEY

customers_bp = Blueprint('customers', __name__)

@customers_bp.post('/customer')
@require_role('admin','merchant')
def create_customer():
    data = request.json
    db, cur = get_db()
    cur.execute(
        """
        INSERT INTO customers (merchant_id, first_name, last_name, email_enc, phone_enc)
        VALUES (%s,%s,%s, AES_ENCRYPT(%s,%s), AES_ENCRYPT(%s,%s))
        """,
        (data['merchant_id'], data['firstname'], data['lastname'], data['email'], AES_KEY, data['phone'], AES_KEY)
    )
    db.commit()
    audit_log(session['user_id'], "ADD_CUSTOMER", "customers")
    return {"message": "customer added"}


@customers_bp.post('/customer/store_with_card')
@require_role('admin','merchant')
def store_customer_with_card():
    """Create a new customer and store a card for them in a single request.

    Expected JSON:
    {
      "merchant_id": ..., "firstname": "", "lastname": "",
      "email": "", "phone": "",
      "card": "number", "exp": "MM/YY", "cvv": "123"
    }
    """
    try:
        d = request.json or {}
        # Basic required fields
        required = ['merchant_id', 'firstname', 'lastname', 'email', 'phone', 'card', 'exp', 'cvv']
        for r in required:
            if not d.get(r):
                return jsonify({"error": f"Missing required field: {r}"}), 400

        # Validate card basic shape
        card = str(d['card']).replace(' ', '')
        if not card.isdigit() or len(card) < 13 or len(card) > 19:
            return jsonify({"error": "Invalid card number"}), 400
        cvv = str(d['cvv'])
        if not cvv.isdigit() or len(cvv) < 3 or len(cvv) > 4:
            return jsonify({"error": "Invalid CVV"}), 400

        db, cur = get_db()

        # Insert customer
        cur.execute(
            """
            INSERT INTO customers (merchant_id, first_name, last_name, email_enc, phone_enc)
            VALUES (%s,%s,%s, AES_ENCRYPT(%s,%s), AES_ENCRYPT(%s,%s))
            """,
            (d['merchant_id'], d['firstname'], d['lastname'], d['email'], AES_KEY, d['phone'], AES_KEY)
        )
        # Retrieve inserted customer id
        customer_id = cur.lastrowid

        # Store encrypted card details linked to the newly created customer
        cur.execute(
            """
            INSERT INTO card_vault (customer_id, card_number_enc, card_holder_enc, expiry_date_enc, cvv_enc, last_four_digits, status)
            VALUES (%s, AES_ENCRYPT(%s,%s), AES_ENCRYPT(%s,%s), AES_ENCRYPT(%s,%s), AES_ENCRYPT(%s,%s), %s, 'Active')
            """,
            (customer_id, card, AES_KEY, 'Card', AES_KEY, d['exp'], AES_KEY, cvv, AES_KEY, card[-4:])
        )

        db.commit()

        # Audit logs for both actions
        audit_log(session['user_id'], "ADD_CUSTOMER", "customers", record_id=customer_id)
        audit_log(session['user_id'], "STORE_CARD", "card_vault", record_id=customer_id)

        return jsonify({"message": "customer and card stored", "customer_id": customer_id}), 201
    except Exception as e:
        # Attempt to rollback if possible
        try:
            db.rollback()
        except Exception:
            pass
        return jsonify({"error": str(e)}), 500

@customers_bp.get('/customer/list')
@require_role('admin','merchant')
def list_customers():
    db, cur = get_db()
    cur.execute("SELECT customer_id, first_name AS firstname, last_name AS lastname, AES_DECRYPT(email_enc, %s) AS email, AES_DECRYPT(phone_enc, %s) AS phone, merchant_id FROM customers WHERE status='Active'", (AES_KEY, AES_KEY))
    rows = cur.fetchall()
    customers = [dict(zip([desc[0] for desc in cur.description], r)) for r in rows]

    # Decode any binary fields returned from AES_DECRYPT so JSON serialization succeeds
    for c in customers:
        for k, v in list(c.items()):
            if isinstance(v, (bytes, bytearray)):
                try:
                    c[k] = v.decode('utf-8')
                except Exception:
                    c[k] = v.hex()

    return jsonify({'customers': customers})