from marshmallow import Schema, fields, validate

class InventoryItemSchema(Schema):
    id = fields.Int(dump_only=True)
    productId = fields.Int(required=True, attribute='product_id')
    quantity = fields.Int(required=True, validate=validate.Range(min=0))
    location = fields.Str(validate=validate.Length(max=100))
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class InventoryAdjustmentSchema(Schema):
    productId = fields.Int(required=True)
    quantity = fields.Int(required=True)
    location = fields.Str()
    reason = fields.Str(required=True, validate=validate.Length(min=1, max=255))
