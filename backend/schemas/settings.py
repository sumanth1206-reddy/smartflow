from marshmallow import Schema, fields, validate, EXCLUDE

class SettingsSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    orgName = fields.Str(attribute='org_name', validate=validate.Length(max=255))
    email = fields.Str(validate=validate.Length(max=255))
    currency = fields.Str(validate=validate.Length(max=10))
    timezone = fields.Str(validate=validate.Length(max=50))
    taxRate = fields.Float(attribute='tax_rate', validate=validate.Range(min=0.0))
    invoicePrefix = fields.Str(attribute='invoice_prefix', validate=validate.Length(max=20))
    paymentTerms = fields.Str(attribute='payment_terms', validate=validate.Length(max=50))
    barcodeScanner = fields.Bool(attribute='barcode_scanner')
    autoPrintReceipt = fields.Bool(attribute='auto_print_receipt')
    lowStockThreshold = fields.Int(attribute='low_stock_threshold', validate=validate.Range(min=0))
    emailAlerts = fields.Bool(attribute='email_alerts')
    aiAlerts = fields.Bool(attribute='ai_alerts')
    autoBackup = fields.Bool(attribute='auto_backup')
    backupInterval = fields.Str(attribute='backup_interval', validate=validate.Length(max=50))
