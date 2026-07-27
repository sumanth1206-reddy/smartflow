from backend.extensions import db
from backend.models.user import User
from backend.models.product import Product
from backend.models.inventory import InventoryItem, StockHistory
from backend.models.settings import Settings
from backend.models.notification import Notification
from backend.models.category import Category
from backend.models.supplier import Supplier

def seed_db():
    # 1. Seed Admin User
    admin_email = 'reddysumanth1206@gmail.com'
    existing_user = User.query.filter_by(email=admin_email).first()
    
    if not existing_user:
        admin = User(
            email=admin_email,
            name='Reddy Sumanth',
            phone='+1 555 0123',
            role='Admin',
            address='42 Harbor Avenue'
        )
        admin.set_password('238P1A04A8')
        db.session.add(admin)
        print("Admin user seeded.")
    else:
        print("Admin user already exists.")

    # 2. Seed Default Settings
    existing_settings = Settings.query.filter_by(id=1).first()
    if not existing_settings:
        settings = Settings(
            id=1,
            org_name='SmartFlow Operations',
            email='billing@smartflow.com',
            currency='₹',
            timezone='IST',
            low_stock_threshold=10
        )
        db.session.add(settings)
        print("Default settings seeded.")
    else:
        print("Default settings already exist.")

    # 3. Seed Categories
    categories = ['Food', 'Health', 'Tech', 'Lighting', 'Furniture', 'Accessories', 'Audio', 'Home', 'Fashion', 'Office']
    for cat_name in categories:
        existing_cat = Category.query.filter_by(name=cat_name).first()
        if not existing_cat:
            db.session.add(Category(name=cat_name, description=f"{cat_name} product collection"))
    print("Categories seeded.")

    # 4. Seed Suppliers
    suppliers_data = [
        {"name": "Global Foods Ltd", "contact_name": "John Doe", "email": "contact@globalfoods.com", "phone": "+91 9988776655", "address": "Mumbai, India"},
        {"name": "SmartTech Wholesalers", "contact_name": "Sarah Connor", "email": "sales@smarttech.com", "phone": "+1 555 9876", "address": "California, USA"}
    ]
    for sup in suppliers_data:
        existing_sup = Supplier.query.filter_by(name=sup["name"]).first()
        if not existing_sup:
            db.session.add(Supplier(**sup))
    print("Suppliers seeded.")

    # 5. Seed Products and Inventory
    products_data = [
        {"name": "Rice", "sku": "PROD-RICE", "category": "Food", "price": 60.00, "cost_price": 45.00, "quantity": 50, "status": "In Stock", "image": "🌾"},
        {"name": "Milk", "sku": "PROD-MILK", "category": "Food", "price": 40.00, "cost_price": 30.00, "quantity": 12, "status": "Low Stock", "image": "🥛"},
        {"name": "Soap", "sku": "PROD-SOAP", "category": "Health", "price": 30.00, "cost_price": 20.00, "quantity": 8, "status": "Low Stock", "image": "🧼"},
        {"name": "Sugar", "sku": "PROD-SUGAR", "category": "Food", "price": 50.00, "cost_price": 38.00, "quantity": 0, "status": "Out of Stock", "image": "🍬"},
        {"name": "Oil", "sku": "PROD-OIL", "category": "Food", "price": 120.00, "cost_price": 95.00, "quantity": 35, "status": "In Stock", "image": "🛢️"}
    ]

    for prod in products_data:
        existing_prod = Product.query.filter_by(sku=prod["sku"]).first()
        if not existing_prod:
            # Create product
            new_prod = Product(
                name=prod["name"],
                sku=prod["sku"],
                category=prod["category"],
                price=prod["price"],
                cost_price=prod["cost_price"],
                quantity=prod["quantity"],
                status=prod["status"],
                image=prod["image"]
            )
            db.session.add(new_prod)
            db.session.flush()  # Get product.id

            # Create warehouse inventory item
            new_inv = InventoryItem(
                product_id=new_prod.id,
                quantity=prod["quantity"],
                location='Warehouse A'
            )
            db.session.add(new_inv)

            # Add to stock history
            new_hist = StockHistory(
                product_id=new_prod.id,
                change_amount=prod["quantity"],
                reason='Initial Seed'
            )
            db.session.add(new_hist)
    print("Products and inventory seeded.")

    # 6. Seed Notifications
    notifications_data = [
        {"type": "INVENTORY", "title": "Low Stock Alert", "message": "Milk only has 12 units remaining", "read": False},
        {"type": "WARNING", "title": "Low Stock Alert", "message": "Soap only has 8 units remaining", "read": False},
        {"type": "WARNING", "title": "Out of Stock Alert", "message": "Sugar requires immediate restocking", "read": False},
        {"type": "INFO", "title": "Welcome to SmartFlow", "message": "Backend server and database successfully initialized.", "read": True}
    ]
    for note in notifications_data:
        existing_note = Notification.query.filter_by(message=note["message"]).first()
        if not existing_note:
            db.session.add(Notification(**note))
    print("Notifications seeded.")

    db.session.commit()
    print("Database seeding completed successfully!")
