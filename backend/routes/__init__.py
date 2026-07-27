from backend.routes.auth import auth_bp
from backend.routes.products import products_bp
from backend.routes.sales import sales_bp
from backend.routes.inventory import inventory_bp
from backend.routes.settings import settings_bp
from backend.routes.notifications import notifications_bp
from backend.routes.dashboard import dashboard_bp
from backend.routes.categories import categories_bp
from backend.routes.suppliers import suppliers_bp
from backend.routes.orders import orders_bp
from backend.routes.reports import reports_bp
from backend.routes.ai import ai_bp

def register_blueprints(app):
    # Prefix API prefix (/api) to match frontend requests proxy config
    api_prefix = '/api'
    
    app.register_blueprint(auth_bp, url_prefix=f"{api_prefix}/auth")
    app.register_blueprint(products_bp, url_prefix=f"{api_prefix}/products")
    app.register_blueprint(sales_bp, url_prefix=f"{api_prefix}/sales")
    app.register_blueprint(inventory_bp, url_prefix=f"{api_prefix}/inventory")
    app.register_blueprint(settings_bp, url_prefix=f"{api_prefix}/settings")
    app.register_blueprint(notifications_bp, url_prefix=f"{api_prefix}/notifications")
    app.register_blueprint(dashboard_bp, url_prefix=f"{api_prefix}/dashboard")
    app.register_blueprint(categories_bp, url_prefix=f"{api_prefix}/categories")
    app.register_blueprint(suppliers_bp, url_prefix=f"{api_prefix}/suppliers")
    app.register_blueprint(orders_bp, url_prefix=f"{api_prefix}/orders")
    app.register_blueprint(reports_bp, url_prefix=f"{api_prefix}/reports")
    app.register_blueprint(ai_bp, url_prefix=f"{api_prefix}/ai")
