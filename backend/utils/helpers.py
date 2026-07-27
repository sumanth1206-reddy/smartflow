import re
from backend.models.sale import Sale
from backend.extensions import db

def clean_currency_value(val):
    """
    Cleans currency strings (e.g., '₹540.00' or '$1,200.50') and returns a float.
    """
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
        
    # Strip common currency symbols, commas, and whitespace
    cleaned = re.sub(r'[^\d.]', '', str(val).replace(',', '').strip())
    try:
        return float(cleaned)
    except ValueError:
        return 0.0

def generate_next_invoice_id(prefix="INV-"):
    """
    Finds the maximum numeric part among all invoice IDs in the database and increments it.
    """
    sales = db.session.query(Sale.id).all()
    if not sales:
        return f"{prefix}1001"
    
    nums = []
    for (s_id,) in sales:
        match = re.search(r'\d+', s_id)
        if match:
            nums.append(int(match.group()))
            
    if not nums:
        return f"{prefix}1001"
        
    next_num = max(nums) + 1
    return f"{prefix}{next_num}"
