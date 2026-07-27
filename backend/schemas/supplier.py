from marshmallow import Schema, fields, validate

class SupplierSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    contactName = fields.Str(attribute='contact_name', validate=validate.Length(max=255), allow_none=True)
    email = fields.Email(validate=validate.Length(max=255), allow_none=True)
    phone = fields.Str(validate=validate.Length(max=50), allow_none=True)
    address = fields.Str(allow_none=True)
    history = fields.Str(allow_none=True)
