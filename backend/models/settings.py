from datetime import datetime
from backend.extensions import db

class Settings(db.Model):
    __tablename__ = 'settings'

    id = db.Column(db.Integer, primary_key=True, default=1)
    org_name = db.Column(db.String(255), default='SmartFlow Operations')
    email = db.Column(db.String(255), default='billing@smartflow.com')
    currency = db.Column(db.String(10), default='₹')
    timezone = db.Column(db.String(50), default='IST')
    tax_rate = db.Column(db.Numeric(5, 2), default=8.00)
    invoice_prefix = db.Column(db.String(20), default='INV-')
    payment_terms = db.Column(db.String(50), default='Due on Receipt')
    barcode_scanner = db.Column(db.Boolean, default=False)
    auto_print_receipt = db.Column(db.Boolean, default=False)
    low_stock_threshold = db.Column(db.Integer, default=10)
    email_alerts = db.Column(db.Boolean, default=False)
    ai_alerts = db.Column(db.Boolean, default=False)
    auto_backup = db.Column(db.Boolean, default=False)
    backup_interval = db.Column(db.String(50), default='Disabled')

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "orgName": self.org_name,
            "email": self.email,
            "currency": self.currency,
            "timezone": self.timezone,
            "taxRate": float(self.tax_rate) if self.tax_rate else 8.00,
            "invoicePrefix": self.invoice_prefix,
            "paymentTerms": self.payment_terms,
            "barcodeScanner": self.barcode_scanner,
            "autoPrintReceipt": self.auto_print_receipt,
            "lowStockThreshold": self.low_stock_threshold,
            "emailAlerts": self.email_alerts,
            "aiAlerts": self.ai_alerts,
            "autoBackup": self.auto_backup,
            "backupInterval": self.backup_interval
        }
