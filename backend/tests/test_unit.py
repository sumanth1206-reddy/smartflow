import os
import unittest
from datetime import datetime, timedelta
from decimal import Decimal
from flask_jwt_extended import create_access_token

# Adjust Python path to resolve backend
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.app import create_app
from backend.config import Config
from backend.extensions import db
from backend.models.user import User
from backend.models.product import Product
from backend.models.sale import Sale, SaleItem
from backend.models.settings import Settings
from backend.services.ai import AIService

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_SECRET_KEY = 'test-secret-key'

class SmartFlowTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

        # Seed initial system settings
        self.settings = Settings(
            id=1,
            org_name='Test Org',
            email='test@org.com',
            tax_rate=Decimal('10.00'),
            low_stock_threshold=5
        )
        db.session.add(self.settings)

        # Seed an admin user
        self.admin = User(
            email='admin@test.com',
            name='Test Admin',
            role='Admin'
        )
        self.admin.set_password('AdminPassword123!')
        db.session.add(self.admin)
        db.session.commit()

        # Generate a test access token
        self.token = create_access_token(identity=self.admin.email, additional_claims={"role": "Admin"})
        self.headers = {
            "Authorization": f"Bearer {self.token}"
        }

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_user_password_hashing(self):
        user = User(email='user@test.com')
        user.set_password('SecretPass321!')
        self.assertTrue(user.check_password('SecretPass321!'))
        self.assertFalse(user.check_password('wrong_password'))

    def test_product_creation_and_inventory(self):
        product = Product(
            name='Soap Bar',
            sku='SOAP-01',
            price=Decimal('15.50'),
            cost_price=Decimal('10.00'),
            quantity=20,
            status='In Stock'
        )
        db.session.add(product)
        db.session.commit()

        fetched = Product.query.filter_by(sku='SOAP-01').first()
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched.name, 'Soap Bar')
        self.assertEqual(float(fetched.price), 15.50)

    def test_sales_creation_endpoint(self):
        product = Product(
            name='Rice Bag',
            sku='RICE-02',
            price=Decimal('100.00'),
            cost_price=Decimal('80.00'),
            quantity=10,
            status='In Stock'
        )
        db.session.add(product)
        db.session.commit()

        # Create a sale via test client
        payload = {
            "customer": "John Doe",
            "items": [
                {
                    "id": product.id,
                    "qty": 2,
                    "price": "100.00",
                    "amount": "200.00"
                }
            ],
            "total": "220.00",
            "subtotal": "200.00",
            "tax": "20.00",
            "discount": "0.00",
            "status": "Paid",
            "paymentMethod": "Cash",
            "email": "john@doe.com"
        }

        res = self.client.post('/api/sales', json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 201)

        # Check stock was decremented
        updated_prod = Product.query.get(product.id)
        self.assertEqual(updated_prod.quantity, 8)

    def test_insufficient_stock_failure(self):
        product = Product(
            name='Sugar Pack',
            sku='SUGAR-03',
            price=Decimal('50.00'),
            quantity=2,
            status='In Stock'
        )
        db.session.add(product)
        db.session.commit()

        payload = {
            "customer": "Failed Customer",
            "items": [
                {
                    "id": product.id,
                    "qty": 5,
                    "price": "50.00",
                    "amount": "250.00"
                }
            ],
            "total": "250.00",
            "status": "Paid",
            "paymentMethod": "Cash"
        }

        res = self.client.post('/api/sales', json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("Insufficient stock", res.get_json()["error"])

    def test_ai_service_predictions(self):
        product = Product(
            name='Milk Bottle',
            sku='MILK-04',
            price=Decimal('40.00'),
            cost_price=Decimal('30.00'),
            quantity=50,
            status='In Stock'
        )
        db.session.add(product)
        db.session.commit()

        # Generate a sale to create historical data
        sale = Sale(
            id='INV-TEST-01',
            customer='Test',
            date=datetime.utcnow() - timedelta(days=2),
            total=Decimal('80.00')
        )
        db.session.add(sale)
        db.session.flush()

        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=product.id,
            quantity=2,
            price=Decimal('40.00'),
            amount=Decimal('80.00')
        )
        db.session.add(sale_item)
        db.session.commit()

        # Run AI predictions
        predictions = AIService.get_predictions_and_insights()
        self.assertIn("demandForecast", predictions)
        self.assertIn("insights", predictions)
        self.assertTrue(len(predictions["insights"]) > 0)

if __name__ == '__main__':
    unittest.main()
