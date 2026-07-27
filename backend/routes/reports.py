import csv
import io
from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import jwt_required
from backend.extensions import db
from backend.models.product import Product
from backend.models.sale import Sale, SaleItem
from backend.models.supplier import Supplier
from datetime import datetime, timedelta
from sqlalchemy import func

reports_bp = Blueprint('reports', __name__, url_prefix='/reports')

def generate_report_data(report_type, start_date, end_date, category, supplier_id, product_id):
    # 1. SALES REPORT
    if report_type == 'sales':
        query = db.session.query(Sale).outerjoin(SaleItem).outerjoin(Product)
        if start_date:
            query = query.filter(Sale.date >= start_date)
        if end_date:
            query = query.filter(Sale.date <= end_date)
        if category:
            query = query.filter(Product.category == category)
        if supplier_id:
            query = query.filter(Product.supplier_id == supplier_id)
        if product_id:
            query = query.filter(Product.id == product_id)
            
        sales = query.order_by(Sale.date.desc()).distinct().all()
        rows = []
        total_revenue = 0.0
        total_tax = 0.0
        total_discount = 0.0
        
        for s in sales:
            total_revenue += float(s.total or 0)
            total_tax += float(s.tax or 0)
            total_discount += float(s.discount or 0)
            
            item_summary = ", ".join([f"{item.product.name} (x{item.quantity})" for item in s.items if item.product])
            rows.append({
                "id": s.id,
                "customer": s.customer,
                "date": s.date.strftime('%Y-%m-%d %H:%M') if s.date else '',
                "items": item_summary,
                "paymentMethod": s.payment_method,
                "status": s.status,
                "subtotal": float(s.subtotal or 0),
                "tax": float(s.tax or 0),
                "discount": float(s.discount or 0),
                "total": float(s.total or 0)
            })
            
        summary = {
            "Total Sales Count": len(sales),
            "Total Revenue": round(total_revenue, 2),
            "Total GST Collected": round(total_tax, 2),
            "Total Discounts": round(total_discount, 2)
        }
        
        # Group by day for chart
        chart_query = db.session.query(
            func.date(Sale.date).label('day'),
            func.sum(Sale.total).label('day_total')
        ).outerjoin(SaleItem).outerjoin(Product)
        if start_date:
            chart_query = chart_query.filter(Sale.date >= start_date)
        if end_date:
            chart_query = chart_query.filter(Sale.date <= end_date)
        if category:
            chart_query = chart_query.filter(Product.category == category)
        if supplier_id:
            chart_query = chart_query.filter(Product.supplier_id == supplier_id)
        if product_id:
            chart_query = chart_query.filter(Product.id == product_id)
        chart_data_rows = chart_query.group_by(func.date(Sale.date)).order_by(func.date(Sale.date)).all()
        
        chart_data = {
            "labels": [str(r.day) for r in chart_data_rows],
            "values": [float(r.day_total or 0) for r in chart_data_rows]
        }
        
        return summary, rows, chart_data

    # 2. INVENTORY REPORT
    elif report_type == 'inventory':
        query = db.session.query(Product)
        if category:
            query = query.filter(Product.category == category)
        if supplier_id:
            query = query.filter(Product.supplier_id == supplier_id)
        if product_id:
            query = query.filter(Product.id == product_id)
            
        products = query.order_by(Product.name.asc()).all()
        rows = []
        total_items = 0
        total_value = 0.0
        low_stock_count = 0
        
        for p in products:
            val = float(p.price or 0) * p.quantity
            total_items += p.quantity
            total_value += val
            if p.quantity < 10:
                low_stock_count += 1
                
            rows.append({
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "category": p.category,
                "supplier": p.supplier.name if p.supplier else 'N/A',
                "price": float(p.price or 0),
                "costPrice": float(p.cost_price or 0),
                "stock": p.quantity,
                "value": round(val, 2),
                "status": p.status
            })
            
        summary = {
            "Total SKUs": len(products),
            "Total Stock Units": total_items,
            "Total Valuation": round(total_value, 2),
            "Low Stock Items": low_stock_count
        }
        
        cat_query = db.session.query(Product.category, func.sum(Product.quantity)).group_by(Product.category).all()
        chart_data = {
            "labels": [r[0] or 'Uncategorized' for r in cat_query],
            "values": [int(r[1] or 0) for r in cat_query]
        }
        
        return summary, rows, chart_data

    # 3. PROFIT REPORT
    elif report_type == 'profit':
        query = db.session.query(
            Sale.id.label('invoice_id'),
            Sale.date,
            Product.name.label('product_name'),
            SaleItem.quantity,
            SaleItem.price.label('sale_price'),
            Product.cost_price.label('cost_price')
        ).join(SaleItem, Sale.id == SaleItem.sale_id).join(Product, SaleItem.product_id == Product.id)
        
        if start_date:
            query = query.filter(Sale.date >= start_date)
        if end_date:
            query = query.filter(Sale.date <= end_date)
        if category:
            query = query.filter(Product.category == category)
        if supplier_id:
            query = query.filter(Product.supplier_id == supplier_id)
        if product_id:
            query = query.filter(Product.id == product_id)
            
        items = query.order_by(Sale.date.desc()).all()
        rows = []
        total_revenue = 0.0
        total_cost = 0.0
        
        for item in items:
            rev = float(item.quantity) * float(item.sale_price or 0)
            cost = float(item.quantity) * float(item.cost_price or item.sale_price * 0.78)
            profit = rev - cost
            margin = (profit / rev * 100) if rev > 0 else 0.0
            
            total_revenue += rev
            total_cost += cost
            
            rows.append({
                "invoice_id": item.invoice_id,
                "date": item.date.strftime('%Y-%m-%d %H:%M') if item.date else '',
                "product": item.product_name,
                "qty": item.quantity,
                "revenue": round(rev, 2),
                "cost": round(cost, 2),
                "profit": round(profit, 2),
                "margin": round(margin, 1)
            })
            
        total_profit = total_revenue - total_cost
        avg_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0.0
        
        summary = {
            "Total Revenue": round(total_revenue, 2),
            "Total Cost of Sales (COGS)": round(total_cost, 2),
            "Gross Profit": round(total_profit, 2),
            "Average Margin %": round(avg_margin, 1)
        }
        
        chart_query = db.session.query(
            func.date(Sale.date).label('day'),
            func.sum(SaleItem.quantity * SaleItem.price).label('day_rev'),
            func.sum(SaleItem.quantity * func.coalesce(Product.cost_price, SaleItem.price * 0.78)).label('day_cost')
        ).join(SaleItem, Sale.id == SaleItem.sale_id).join(Product, SaleItem.product_id == Product.id)
        if start_date:
            chart_query = chart_query.filter(Sale.date >= start_date)
        if end_date:
            chart_query = chart_query.filter(Sale.date <= end_date)
        if category:
            chart_query = chart_query.filter(Product.category == category)
        if supplier_id:
            chart_query = chart_query.filter(Product.supplier_id == supplier_id)
        if product_id:
            chart_query = chart_query.filter(Product.id == product_id)
        chart_data_rows = chart_query.group_by(func.date(Sale.date)).order_by(func.date(Sale.date)).all()
        
        chart_data = {
            "labels": [str(r.day) for r in chart_data_rows],
            "revenue": [float(r.day_rev or 0) for r in chart_data_rows],
            "profit": [float((r.day_rev or 0) - (r.day_cost or 0)) for r in chart_data_rows]
        }
        
        return summary, rows, chart_data

    # 4. PRODUCT PERFORMANCE
    elif report_type == 'performance':
        query = db.session.query(
            Product.id,
            Product.name,
            Product.sku,
            Product.category,
            func.sum(SaleItem.quantity).label('units_sold'),
            func.sum(SaleItem.amount).label('total_revenue')
        ).join(SaleItem, Product.id == SaleItem.product_id).join(Sale, SaleItem.sale_id == Sale.id)
        
        if start_date:
            query = query.filter(Sale.date >= start_date)
        if end_date:
            query = query.filter(Sale.date <= end_date)
        if category:
            query = query.filter(Product.category == category)
        if supplier_id:
            query = query.filter(Product.supplier_id == supplier_id)
        if product_id:
            query = query.filter(Product.id == product_id)
            
        items = query.group_by(Product.id, Product.name, Product.sku, Product.category).order_by(func.sum(SaleItem.quantity).desc()).all()
        
        rows = []
        total_units = 0
        total_revenue = 0.0
        
        for idx, item in enumerate(items):
            total_units += int(item.units_sold or 0)
            total_revenue += float(item.total_revenue or 0)
            
            rows.append({
                "rank": idx + 1,
                "id": item.id,
                "name": item.name,
                "sku": item.sku,
                "category": item.category,
                "unitsSold": int(item.units_sold or 0),
                "revenue": float(item.total_revenue or 0)
            })
            
        summary = {
            "Unique Products Sold": len(items),
            "Total Units Sold": total_units,
            "Total Sales Revenue": round(total_revenue, 2),
            "Best Seller": items[0].name if items else 'N/A'
        }
        
        chart_data = {
            "labels": [r["name"] for r in rows[:5]],
            "values": [r["unitsSold"] for r in rows[:5]]
        }
        
        return summary, rows, chart_data

    # 5. SUPPLIER REPORT
    elif report_type == 'supplier':
        query = db.session.query(
            Supplier.id,
            Supplier.name,
            Supplier.contact_name,
            Supplier.phone,
            func.count(Product.id).label('sku_count'),
            func.sum(Product.quantity).label('units_in_stock'),
            func.sum(Product.quantity * Product.cost_price).label('stock_value')
        ).outerjoin(Product, Supplier.id == Product.supplier_id)
        
        if supplier_id:
            query = query.filter(Supplier.id == supplier_id)
            
        items = query.group_by(Supplier.id, Supplier.name, Supplier.contact_name, Supplier.phone).order_by(Supplier.name.asc()).all()
        rows = []
        total_skus = 0
        total_stock = 0
        total_value = 0.0
        
        for item in items:
            skus = int(item.sku_count or 0)
            stock = int(item.units_in_stock or 0)
            val = float(item.stock_value or 0)
            
            total_skus += skus
            total_stock += stock
            total_value += val
            
            rows.append({
                "id": item.id,
                "name": item.name,
                "contact": item.contact_name,
                "phone": item.phone,
                "skus": skus,
                "stock": stock,
                "value": round(val, 2)
            })
            
        summary = {
            "Active Suppliers": len(items),
            "Total Supplied SKUs": total_skus,
            "Total Units Supplied": total_stock,
            "Cost Valuation": round(total_value, 2)
        }
        
        chart_data = {
            "labels": [r["name"] for r in rows[:5]],
            "values": [r["skus"] for r in rows[:5]]
        }
        
        return summary, rows, chart_data

    # 6. CUSTOMER REPORT
    elif report_type == 'customer':
        query = db.session.query(
            Sale.customer,
            func.count(Sale.id).label('tx_count'),
            func.sum(Sale.total).label('total_spend')
        )
        if start_date:
            query = query.filter(Sale.date >= start_date)
        if end_date:
            query = query.filter(Sale.date <= end_date)
            
        items = query.group_by(Sale.customer).order_by(func.sum(Sale.total).desc()).all()
        rows = []
        total_customers = len(items)
        total_spent = 0.0
        
        for item in items:
            tx = int(item.tx_count or 0)
            spend = float(item.total_spend or 0)
            avg_val = spend / tx if tx > 0 else 0.0
            total_spent += spend
            
            rows.append({
                "customer": item.customer or 'Walk-in Customer',
                "transactions": tx,
                "totalSpent": round(spend, 2),
                "avgOrderValue": round(avg_val, 2)
            })
            
        summary = {
            "Total Customers": total_customers,
            "Total Customer Spend": round(total_spent, 2),
            "Average Lifetime Value": round(total_spent / total_customers, 2) if total_customers > 0 else 0.0,
            "Top Customer": items[0].customer if items else 'N/A'
        }
        
        chart_data = {
            "labels": [r["customer"] for r in rows[:5]],
            "values": [r["totalSpent"] for r in rows[:5]]
        }
        
        return summary, rows, chart_data

    # 7. MONTHLY REPORT
    elif report_type == 'monthly':
        query = db.session.query(
            func.date_trunc('month', Sale.date).label('month'),
            func.count(Sale.id).label('tx_count'),
            func.sum(Sale.total).label('total_sales')
        )
        if start_date:
            query = query.filter(Sale.date >= start_date)
        if end_date:
            query = query.filter(Sale.date <= end_date)
            
        items = query.group_by(func.date_trunc('month', Sale.date)).order_by(func.date_trunc('month', Sale.date).desc()).all()
        rows = []
        total_sales = 0.0
        total_tx = 0
        
        for item in items:
            tx = int(item.tx_count or 0)
            sales_val = float(item.total_sales or 0)
            total_sales += sales_val
            total_tx += tx
            
            rows.append({
                "month": item.month.strftime('%Y-%m') if item.month else '',
                "transactions": tx,
                "revenue": round(sales_val, 2)
            })
            
        summary = {
            "Total Months Analyzed": len(items),
            "Total Transactions": total_tx,
            "Accumulated Revenue": round(total_sales, 2),
            "Average Monthly Sales": round(total_sales / len(items), 2) if items else 0.0
        }
        
        chart_data = {
            "labels": [r["month"] for r in reversed(rows)],
            "values": [r["revenue"] for r in reversed(rows)]
        }
        
        return summary, rows, chart_data

    # 8. DAILY REPORT
    elif report_type == 'daily':
        query = db.session.query(
            func.date(Sale.date).label('day'),
            func.count(Sale.id).label('tx_count'),
            func.sum(Sale.total).label('total_sales')
        )
        if start_date:
            query = query.filter(Sale.date >= start_date)
        if end_date:
            query = query.filter(Sale.date <= end_date)
            
        items = query.group_by(func.date(Sale.date)).order_by(func.date(Sale.date).desc()).all()
        rows = []
        total_sales = 0.0
        total_tx = 0
        
        for item in items:
            tx = int(item.tx_count or 0)
            sales_val = float(item.total_sales or 0)
            total_sales += sales_val
            total_tx += tx
            
            rows.append({
                "date": str(item.day),
                "transactions": tx,
                "revenue": round(sales_val, 2)
            })
            
        summary = {
            "Total Days Analyzed": len(items),
            "Total Transactions": total_tx,
            "Accumulated Revenue": round(total_sales, 2),
            "Average Daily Sales": round(total_sales / len(items), 2) if items else 0.0
        }
        
        chart_data = {
            "labels": [r["date"] for r in reversed(rows[:10])],
            "values": [r["revenue"] for r in reversed(rows[:10])]
        }
        
        return summary, rows, chart_data

@reports_bp.route('/data', methods=['GET'])
@jwt_required()
def get_reports_data():
    report_type = request.args.get('reportType', 'sales')
    start_date_str = request.args.get('startDate')
    end_date_str = request.args.get('endDate')
    category = request.args.get('category')
    supplier_id = request.args.get('supplierId')
    product_id = request.args.get('productId')
    
    start_date = None
    end_date = None
    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        except ValueError:
            pass
    if end_date_str:
        try:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d') + timedelta(days=1) - timedelta(seconds=1)
        except ValueError:
            pass
            
    summary, rows, chart_data = generate_report_data(report_type, start_date, end_date, category, supplier_id, product_id)
    return jsonify({
        "summary": summary,
        "rows": rows,
        "chartData": chart_data
    }), 200

@reports_bp.route('/export', methods=['GET'])
@jwt_required()
def export_reports_csv():
    report_type = request.args.get('reportType', 'sales')
    start_date_str = request.args.get('startDate')
    end_date_str = request.args.get('endDate')
    category = request.args.get('category')
    supplier_id = request.args.get('supplierId')
    product_id = request.args.get('productId')
    
    start_date = None
    end_date = None
    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        except ValueError:
            pass
    if end_date_str:
        try:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d') + timedelta(days=1) - timedelta(seconds=1)
        except ValueError:
            pass
            
    summary, rows, chart_data = generate_report_data(report_type, start_date, end_date, category, supplier_id, product_id)
    
    si = io.StringIO()
    cw = csv.writer(si)
    
    if report_type == 'sales':
        cw.writerow(['Invoice ID', 'Customer', 'Date', 'Items Sold', 'Payment Method', 'Status', 'Subtotal', 'Tax', 'Discount', 'Total'])
        for r in rows:
            cw.writerow([r['id'], r['customer'], r['date'], r['items'], r['paymentMethod'], r['status'], r['subtotal'], r['tax'], r['discount'], r['total']])
    elif report_type == 'inventory':
        cw.writerow(['ID', 'Name', 'SKU', 'Category', 'Supplier', 'Price', 'Cost Price', 'Stock Level', 'Valuation', 'Status'])
        for r in rows:
            cw.writerow([r['id'], r['name'], r['sku'], r['category'], r['supplier'], r['price'], r['costPrice'], r['stock'], r['value'], r['status']])
    elif report_type == 'profit':
        cw.writerow(['Invoice ID', 'Date', 'Product', 'Quantity', 'Revenue', 'Cost', 'Profit', 'Margin %'])
        for r in rows:
            cw.writerow([r['invoice_id'], r['date'], r['product'], r['qty'], r['revenue'], r['cost'], r['profit'], r['margin']])
    elif report_type == 'performance':
        cw.writerow(['Rank', 'ID', 'Name', 'SKU', 'Category', 'Units Sold', 'Revenue'])
        for r in rows:
            cw.writerow([r['rank'], r['id'], r['name'], r['sku'], r['category'], r['unitsSold'], r['revenue']])
    elif report_type == 'supplier':
        cw.writerow(['ID', 'Name', 'Contact Person', 'Phone', 'SKUs Supplied', 'Stock Units', 'Valuation'])
        for r in rows:
            cw.writerow([r['id'], r['name'], r['contact'], r['phone'], r['skus'], r['stock'], r['value']])
    elif report_type == 'customer':
        cw.writerow(['Customer Name', 'Transactions', 'Total Spent', 'Average Order Value'])
        for r in rows:
            cw.writerow([r['customer'], r['transactions'], r['totalSpent'], r['avgOrderValue']])
    elif report_type == 'monthly':
        cw.writerow(['Month', 'Transactions', 'Revenue'])
        for r in rows:
            cw.writerow([r['month'], r['transactions'], r['revenue']])
    elif report_type == 'daily':
        cw.writerow(['Date', 'Transactions', 'Revenue'])
        for r in rows:
            cw.writerow([r['date'], r['transactions'], r['revenue']])
            
    output = make_response(si.getvalue())
    output.headers["Content-Disposition"] = f"attachment; filename={report_type}_report.csv"
    output.headers["Content-type"] = "text/csv"
    return output
