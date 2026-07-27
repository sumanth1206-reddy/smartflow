from marshmallow import Schema, fields, validate, EXCLUDE

class SaleItemSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        
    id = fields.Int(required=True)  # Product ID
    qty = fields.Int(required=True, validate=validate.Range(min=1))
    price = fields.Raw(required=True)  # String or float
    amount = fields.Raw(required=True)  # String or float

class SaleSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        
    customer = fields.Str(allow_none=True)
    items = fields.List(fields.Nested(SaleItemSchema), required=True)
    total = fields.Raw(required=True)  # String (e.g. "₹540.00") or float
    status = fields.Str(validate=validate.OneOf(['Paid', 'Pending']))
    paymentMethod = fields.Str(attribute='payment_method')
    email = fields.Email(allow_none=True)
    subtotal = fields.Raw(allow_none=True)
    tax = fields.Raw(allow_none=True)
    discount = fields.Raw(allow_none=True)
    phone = fields.Str(allow_none=True)
    address = fields.Str(allow_none=True)
