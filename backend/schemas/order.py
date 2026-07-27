from marshmallow import Schema, fields, validate, EXCLUDE

class OrderItemSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    productId = fields.Int(required=True, attribute='product_id')
    qty = fields.Int(required=True, attribute='quantity', validate=validate.Range(min=1))
    price = fields.Float(required=True, validate=validate.Range(min=0.0))

class OrderSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    id = fields.Int(dump_only=True)
    supplierId = fields.Int(required=True, attribute='supplier_id')
    supplierName = fields.Str(dump_only=True)
    orderDate = fields.DateTime(dump_only=True)
    status = fields.Str(validate=validate.OneOf(['Pending', 'Ordered', 'Received', 'Cancelled']))
    totalAmount = fields.Float(attribute='total_amount')
    items = fields.List(fields.Nested(OrderItemSchema), required=True)
