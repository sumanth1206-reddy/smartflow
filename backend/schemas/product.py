from marshmallow import Schema, fields, validate, EXCLUDE

class ProductSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    sku = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    category = fields.Str(validate=validate.Length(max=100))
    price = fields.Float(required=True, validate=validate.Range(min=0.0))
    costPrice = fields.Float(attribute='cost_price', validate=validate.Range(min=0.0), allow_none=True)
    quantity = fields.Int(validate=validate.Range(min=0))
    status = fields.Str(validate=validate.OneOf(['In Stock', 'Low Stock', 'Out of Stock']))
    image = fields.Str(validate=validate.Length(max=255), allow_none=True)
    barcode = fields.Str(allow_none=True, validate=validate.Length(max=100))
    expiryDate = fields.DateTime(attribute='expiry_date', allow_none=True)
    supplierId = fields.Int(attribute='supplier_id', allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
