from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from backend.extensions import db
from backend.models.product import Product
from backend.models.category import Category
from backend.models.supplier import Supplier
from backend.models.order import Order
from backend.models.sale import Sale, SaleItem
from backend.models.inventory import StockHistory
from backend.models.settings import Settings
from backend.models.notification import Notification
from sqlalchemy.sql import func
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/dashboard')

@dashboard_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_summary():
    # Load settings for threshold
    settings = Settings.query.filter_by(id=1).first()
    low_stock_limit = settings.low_stock_threshold if settings else 10

    # Counts
    total_products = Product.query.count()
    total_categories = Category.query.count()
    total_suppliers = Supplier.query.count()
    low_stock_count = Product.query.filter(Product.quantity > 0, Product.quantity < low_stock_limit).count()
    out_of_stock_count = Product.query.filter(Product.quantity == 0).count()
    expired_count = Product.query.filter(Product.expiry_date != None, Product.expiry_date < datetime.utcnow()).count()
    
    # Live Inventory Value (Retail price basis)
    inventory_val_db = db.session.query(func.sum(Product.quantity * Product.price)).scalar()
    inventory_value = float(inventory_val_db) if inventory_val_db else 0.0

    # Sales Aggregations
    total_revenue_db = db.session.query(func.sum(Sale.total)).scalar()
    total_revenue = float(total_revenue_db) if total_revenue_db else 0.0

    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    today_sales_rev_db = db.session.query(func.sum(Sale.total)).filter(Sale.date >= today_start).scalar()
    today_sales_rev = float(today_sales_rev_db) if today_sales_rev_db else 0.0

    today_sales_count = Sale.query.filter(Sale.date >= today_start).count()

    thirty_days_ago = now - timedelta(days=30)
    monthly_sales_rev_db = db.session.query(func.sum(Sale.total)).filter(Sale.date >= thirty_days_ago).scalar()
    monthly_sales_rev = float(monthly_sales_rev_db) if monthly_sales_rev_db else 0.0

    monthly_sales_count = Sale.query.filter(Sale.date >= thirty_days_ago).count()

    # Exact calculated gross profit (Sales price - Product cost price, with fallback of 22% margin if cost_price is 0/None)
    profit_sum = db.session.query(
        func.sum(SaleItem.quantity * (SaleItem.price - func.coalesce(Product.cost_price, SaleItem.price * 0.78)))
    ).join(Product, SaleItem.product_id == Product.id).scalar()
    total_profit = float(profit_sum) if profit_sum is not None else 0.0

    # Recent orders, sales, and notifications
    recent_orders = [o.to_dict() for o in Order.query.order_by(Order.order_date.desc()).limit(5).all()]
    recent_sales_list = [s.to_dict() for s in Sale.query.order_by(Sale.date.desc()).limit(5).all()]
    recent_notifications = [n.to_dict() for n in Notification.query.order_by(Notification.created_at.desc()).limit(5).all()]

    # Calculate recent activities
    recent_activities = []
    
    # Fetch recent sales
    for s in recent_sales_list[:5]:
        recent_activities.append({
            "id": f"sale-{s['id']}",
            "title": "Sale Completed",
            "detail": f"Invoice #{s['id']} generated for {s['customer']}",
            "time": s['date']
        })
        
    # Fetch recent stock history
    recent_history = StockHistory.query.order_by(StockHistory.created_at.desc()).limit(5).all()
    for h in recent_history:
        time_str = h.created_at.strftime('%Y-%m-%d %H:%M')
        if h.change_amount > 0:
            detail = f"{h.product.name} stock increased by {h.change_amount} units"
            title = "Inventory Updated"
        else:
            detail = f"{h.product.name} stock decreased by {abs(h.change_amount)} units"
            title = "Inventory Deducted"
            
        recent_activities.append({
            "id": f"history-{h.id}",
            "title": title,
            "detail": detail,
            "time": time_str
        })
        
    # Sort activities by time desc
    recent_activities.sort(key=lambda x: x["time"], reverse=True)
    recent_activities = recent_activities[:10]

    # Weekly Sales (last 7 days)
    weekly_sales = []
    for i in range(6, -1, -1):
        day = now.date() - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        
        rev = db.session.query(func.sum(Sale.total)).filter(
            Sale.date >= day_start,
            Sale.date <= day_end
        ).scalar() or 0.0
        
        weekly_sales.append({
            "day": day.strftime('%a'),
            "date": day.strftime('%Y-%m-%d'),
            "revenue": float(rev)
        })

    # Monthly Sales Chart (last 6 months)
    monthly_sales_chart = []
    current_date = datetime.utcnow()
    for i in range(5, -1, -1):
        # Calculate start/end of that month
        first_of_month = (current_date.replace(day=1) - timedelta(days=i*30)).replace(day=1)
        next_month = (first_of_month + timedelta(days=32)).replace(day=1)
        
        rev = db.session.query(func.sum(Sale.total)).filter(
            Sale.date >= first_of_month,
            Sale.date < next_month
        ).scalar() or 0.0
        
        prof = db.session.query(
            func.sum(SaleItem.quantity * (SaleItem.price - func.coalesce(Product.cost_price, SaleItem.price * 0.78)))
        ).join(Sale, SaleItem.sale_id == Sale.id)\
         .join(Product, SaleItem.product_id == Product.id)\
         .filter(Sale.date >= first_of_month, Sale.date < next_month).scalar() or 0.0
        
        monthly_sales_chart.append({
            "month": first_of_month.strftime('%b %Y'),
            "revenue": float(rev),
            "profit": float(prof)
        })

    # Inventory Trend (last 7 days calculated backwards from current total stock)
    current_total_stock = db.session.query(func.sum(Product.quantity)).scalar() or 0
    running_total = current_total_stock
    trend_data = []
    for i in range(7):
        day = now.date() - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        
        day_change = db.session.query(func.sum(StockHistory.change_amount)).filter(
            StockHistory.created_at >= day_start,
            StockHistory.created_at <= day_end
        ).scalar() or 0
        
        trend_data.append({
            "date": day.strftime('%b %d'),
            "value": running_total
        })
        running_total -= day_change
        
    inventory_trend = list(reversed(trend_data))

    # Top Selling Products (top 5 by quantity sold)
    top_selling_raw = db.session.query(
        Product.name,
        func.sum(SaleItem.quantity).label('total_qty')
    ).join(SaleItem, Product.id == SaleItem.product_id)\
     .group_by(Product.name)\
     .order_by(func.sum(SaleItem.quantity).desc())\
     .limit(5).all()

    top_selling = [{"name": name, "value": int(qty)} for name, qty in top_selling_raw]

    # Category Distribution
    cat_dist_raw = db.session.query(
        Product.category,
        func.count(Product.id).label('prod_count'),
        func.sum(Product.quantity).label('total_qty')
    ).group_by(Product.category).all()

    category_distribution = [
        {
            "name": cat or "Uncategorized",
            "count": prod_count,
            "value": int(total_qty) if total_qty else 0
        } for cat, prod_count, total_qty in cat_dist_raw
    ]

    return jsonify({
        "totalProducts": total_products,
        "totalCategories": total_categories,
        "totalSuppliers": total_suppliers,
        "todaySalesRevenue": today_sales_rev,
        "todaySalesCount": today_sales_count,
        "monthlySalesRevenue": monthly_sales_rev,
        "monthlySalesCount": monthly_sales_count,
        "totalRevenue": total_revenue,
        "totalProfit": total_profit,
        "inventoryValue": inventory_value,
        "lowStockCount": low_stock_count,
        "outOfStockCount": out_of_stock_count,
        "expiredCount": expired_count,
        "recentOrders": recent_orders,
        "recentSales": recent_sales_list,
        "recentNotifications": recent_notifications,
        "recentActivities": recent_activities,
        "weeklySales": weekly_sales,
        "monthlySalesTrend": monthly_sales_chart,
        "inventoryTrend": inventory_trend,
        "topSellingProducts": top_selling,
        "categoryDistribution": category_distribution
    }), 200
