from marshmallow import Schema, fields, validate

class UserSchema(Schema):
    id = fields.Int(dump_only=True)
    email = fields.Email(required=True, validate=validate.Length(max=255))
    password = fields.Str(required=True, load_only=True, validate=validate.Length(min=6))
    name = fields.Str(validate=validate.Length(max=255))
    phone = fields.Str(validate=validate.Length(max=50))
    role = fields.Str(validate=validate.OneOf(['Admin', 'Operations Manager', 'Cashier']))
    address = fields.Str()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class UserLoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)

class UserProfileUpdateSchema(Schema):
    name = fields.Str(validate=validate.Length(max=255))
    email = fields.Email(validate=validate.Length(max=255))
    phone = fields.Str(validate=validate.Length(max=50))
    role = fields.Str()
    address = fields.Str()
    password = fields.Str(validate=validate.Length(min=6))
