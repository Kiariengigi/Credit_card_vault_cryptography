from db import get_db
from datetime import datetime
from flask import request 

def audit_log(user_id, action_type, table_name, old_value="", new_value="", record_id=None):
    db, cur = get_db()
    ip_address = request.remote_addr
    cur.execute(
        """
        INSERT INTO audit_logs (user_id, table_name, action_type, record_id, old_value, new_value, ip_address)
        VALUES (%s,%s,%s,%s,%s,%s,%s)""",
        (user_id, table_name, action_type, record_id, old_value, new_value, ip_address)
    )
    db.commit()