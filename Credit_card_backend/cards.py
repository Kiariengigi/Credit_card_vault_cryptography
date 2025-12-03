from flask import Blueprint, request, session, jsonify
from db import get_db
from utils.decorators import require_role
from utils.logger import audit_log
from config import AES_KEY

cards_bp = Blueprint('cards', __name__)

# -------------------------------
# Store a card
# -------------------------------
@cards_bp.post('/card/store')
@require_role('admin','merchant','customer')  # allow customers too
def store_card():
    try:
        d = request.json
        
        # Validate required fields
        if not d.get('customer_id') or not d.get('card') or not d.get('exp') or not d.get('cvv'):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Customers can only store for themselves
        # Note: We cast to string/int to ensure type safety during comparison
        if session.get('user_role') == 'customer' and str(session.get('user_id')) != str(d['customer_id']):
            return jsonify({"error": "Forbidden"}), 403
        
        # Basic validation
        if not str(d['card']).isdigit() or len(str(d['card'])) < 13 or len(str(d['card'])) > 19:
            return jsonify({"error": "Invalid card number"}), 400
        if not str(d['cvv']).isdigit() or len(str(d['cvv'])) < 3 or len(str(d['cvv'])) > 4:
            return jsonify({"error": "Invalid CVV"}), 400

        db, cur = get_db()
        
        # FIX: Check 'users' table instead of 'customers' table
        # The login returns user_id, so we must validate against that.
        cur.execute("SELECT user_id FROM users WHERE user_id = %s", (d['customer_id'],))
        if not cur.fetchone():
            return jsonify({"error": "User not found"}), 404
        
        # Store encrypted card details
        # Added 'is_default' = 0 to fix the "Field 'is_default' doesn't have a default value" error
        cur.execute(
            """
            INSERT INTO card_vault (customer_id, card_number_enc, card_holder_enc, expiry_date_enc, cvv_enc, last_four_digits, status, is_default)
            VALUES (%s, AES_ENCRYPT(%s,%s), AES_ENCRYPT(%s,%s), AES_ENCRYPT(%s,%s), AES_ENCRYPT(%s,%s), %s, 'Active', 0)
            """,
            (d['customer_id'], d['card'], AES_KEY, d.get('cardholderName','Card'), AES_KEY, d['exp'], AES_KEY, d['cvv'], AES_KEY, str(d['card'])[-4:])
        )
        db.commit()
        
        audit_log(session['user_id'], "STORE_CARD", "card_vault", record_id=d['customer_id'])
        return jsonify({"message": "Card stored successfully"}), 201

    except Exception as e:
        print(f"Error storing card: {e}") # Added server-side logging
        return jsonify({"error": str(e)}), 500

# -------------------------------
# List cards
# -------------------------------
@cards_bp.get('/card/list')
@require_role('admin','merchant','customer')
def list_cards():
    try:
        db, cur = get_db()
        
        # We handle both 'role' and 'user_role' session keys just in case
        role = session.get('role') or session.get('user_role')
        user_id = session.get('user_id')

        if role == 'customer':
            # Only list the logged-in customer's cards
            cur.execute(
                """
                SELECT card_id, customer_id, AES_DECRYPT(card_number_enc, %s) AS card_number, 
                       AES_DECRYPT(expiry_date_enc, %s) AS expiry_date 
                FROM card_vault 
                WHERE customer_id=%s AND status='Active'
                """,
                (AES_KEY, AES_KEY, user_id)
            )
        else:
            # Admin/merchant can list all cards
            cur.execute(
                """
                SELECT card_id, customer_id, AES_DECRYPT(card_number_enc, %s) AS card_number, 
                       AES_DECRYPT(expiry_date_enc, %s) AS expiry_date 
                FROM card_vault WHERE status='Active'
                """,
                (AES_KEY, AES_KEY)
            )

        rows = cur.fetchall()
        cards = [dict(zip([desc[0] for desc in cur.description], r)) for r in rows]

        # Decode binary fields
        for c in cards:
            for k, v in list(c.items()):
                if isinstance(v, (bytes, bytearray)):
                    try:
                        c[k] = v.decode('utf-8')
                    except Exception:
                        c[k] = v.hex()

        return jsonify({'cards': cards}), 200

    except Exception as e:
        print(f"Error listing cards: {e}")
        return jsonify({"error": str(e)}), 500