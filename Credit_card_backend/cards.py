from flask import Blueprint, request, session, jsonify
from db import get_db
from utils.decorators import require_role
from utils.logger import audit_log
from config import AES_KEY

cards_bp = Blueprint('cards', __name__)

@cards_bp.post('/card/store')
@require_role('admin','merchant')
def store_card():
    """Store an encrypted credit card for a customer"""
    try:
        d = request.json
        
        # Validate required fields
        if not d.get('customer_id') or not d.get('card') or not d.get('exp') or not d.get('cvv'):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Basic validation
        if not str(d['card']).isdigit() or len(str(d['card'])) < 13 or len(str(d['card'])) > 19:
            return jsonify({"error": "Invalid card number"}), 400
        
        if not str(d['cvv']).isdigit() or len(str(d['cvv'])) < 3 or len(str(d['cvv'])) > 4:
            return jsonify({"error": "Invalid CVV"}), 400
        
        db, cur = get_db()
        
        # Check if customer exists
        cur.execute("SELECT customer_id FROM customers WHERE customer_id = %s", (d['customer_id'],))
        if not cur.fetchone():
            return jsonify({"error": "Customer not found"}), 404
        
        # Store encrypted card details
        cur.execute(
            """
            INSERT INTO card_vault (customer_id, card_number_enc, card_holder_enc, expiry_date_enc, cvv_enc, last_four_digits, status)
            VALUES (%s, AES_ENCRYPT(%s,%s), AES_ENCRYPT(%s,%s), AES_ENCRYPT(%s,%s), AES_ENCRYPT(%s,%s), %s, 'Active')
            """,
            (d['customer_id'], d['card'], AES_KEY, 'Card', AES_KEY, d['exp'], AES_KEY, d['cvv'], AES_KEY, str(d['card'])[-4:])
        )
        db.commit()
        
        # Log the action
        audit_log(session['user_id'], "STORE_CARD", "card_vault", record_id=d['customer_id'])
        
        return jsonify({"message": "Card stored successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@cards_bp.get('/card/list')
@require_role('admin','merchant')
def list_cards():
    """List all stored cards"""
    try:
        db, cur = get_db()
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

        # Decode any binary fields returned from AES_DECRYPT (MySQL returns bytes)
        for c in cards:
            for k, v in list(c.items()):
                if isinstance(v, (bytes, bytearray)):
                    try:
                        c[k] = v.decode('utf-8')
                    except Exception:
                        c[k] = v.hex()

        return jsonify({'cards': cards}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@cards_bp.get('/card/<int:customer_id>')
@require_role('admin','merchant')
def get_customer_cards(customer_id):
    """Get all cards for a specific customer"""
    try:
        db, cur = get_db()
        cur.execute(
            """
            SELECT card_id, customer_id, AES_DECRYPT(card_number_enc, %s) AS card_number, 
                   AES_DECRYPT(expiry_date_enc, %s) AS expiry_date 
            FROM card_vault 
            WHERE customer_id = %s AND status='Active'
            """,
            (AES_KEY, AES_KEY, customer_id)
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
        return jsonify({"error": str(e)}), 500

@cards_bp.delete('/card/<int:card_id>')
@require_role('admin','merchant')
def delete_card(card_id):
    """Delete a stored card"""
    try:
        db, cur = get_db()
        
        # Check if card exists
        cur.execute("SELECT card_id FROM card_vault WHERE card_id = %s", (card_id,))
        if not cur.fetchone():
            return jsonify({"error": "Card not found"}), 404
        
        cur.execute("DELETE FROM card_vault WHERE card_id = %s", (card_id,))
        db.commit()
        
        audit_log(session['user_id'], "DELETE_CARD", "card_vault", record_id=card_id)
        
        return jsonify({"message": "Card deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
