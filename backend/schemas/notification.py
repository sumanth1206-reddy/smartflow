from marshmallow import Schema, fields, validate

class NotificationSchema(Schema):
    id = fields.Int(dump_only=True)
    type = fields.Str(validate=validate.OneOf(['WARNING', 'SALE', 'INVENTORY', 'AI', 'INFO']))
    title = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    message = fields.Str(required=True)
    read = fields.Bool()
    created_at = fields.DateTime(dump_only=True)
