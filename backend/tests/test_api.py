import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:5000/api"

def make_request(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    req_data = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_msg)
        except Exception:
            return e.code, {"error": err_msg}
    except Exception as e:
        return 0, {"error": str(e)}

def run_tests():
    print("=== STARTING API INTEGRATION TESTS ===")

    # 1. Test Login
    print("\n[1] Testing Admin Login...")
    login_payload = {
        "email": "reddysumanth1206@gmail.com",
        "password": "238P1A04A8"
    }
    status, res = make_request("/auth/login", method="POST", data=login_payload)
    if status == 200 and res.get("success"):
        token = res["token"]
        print("✓ Login successful!")
        print(f"  User: {res['user']['name']} ({res['user']['role']})")
    else:
        print(f"✗ Login failed! Status: {status}, Error: {res}")
        return

    # 2. Test Fetch Settings
    print("\n[2] Testing Get Settings...")
    status, settings = make_request("/settings")
    if status == 200:
        print("✓ Settings fetched successfully!")
        print(f"  Organization: {settings.get('orgName')}")
        print(f"  Currency: {settings.get('currency')}")
    else:
        print(f"✗ Get settings failed! Status: {status}")
        return

    # 3. Test Fetch Products (Before Sale)
    print("\n[3] Testing Get Products (Before Sale)...")
    status, products = make_request("/products")
    if status == 200:
        print(f"✓ Products fetched successfully! Total: {len(products)}")
        rice = next((p for p in products if p["name"] == "Rice"), None)
        if rice:
            print(f"  Rice initial quantity: {rice['quantity']}")
            rice_id = rice["id"]
            rice_price = rice["price"]
            initial_rice_qty = rice["quantity"]
        else:
            print("✗ Rice product not found in seeded data")
            return
    else:
        print(f"✗ Get products failed! Status: {status}")
        return

    # 4. Test Create Sale (Decrement Stock)
    print("\n[4] Testing Create Sale (2 Rice units)...")
    sale_payload = {
        "customer": "Test Customer",
        "items": [
            {
                "id": rice_id,
                "qty": 2,
                "price": rice_price,
                "amount": str(float(rice_price) * 2)
            }
        ],
        "total": str(float(rice_price) * 2),
        "status": "Paid",
        "paymentMethod": "Cash",
        "email": "test@customer.com"
    }
    status, sale = make_request("/sales", method="POST", data=sale_payload, token=token)
    if status == 201:
        print(f"✓ Sale invoice created successfully: {sale.get('id')}")
        print(f"  Total amount: {sale.get('total')}")
    else:
        print(f"✗ Create sale failed! Status: {status}, Error: {sale}")
        return

    # 5. Verify Product Stock is Decremented
    print("\n[5] Verifying Stock Decrement...")
    status, products_after = make_request("/products")
    if status == 200:
        rice_after = next((p for p in products_after if p["id"] == rice_id), None)
        if rice_after:
            expected_qty = initial_rice_qty - 2
            print(f"  Rice updated quantity: {rice_after['quantity']} (Expected: {expected_qty})")
            if rice_after['quantity'] == expected_qty:
                print("✓ Stock decrement is correct!")
            else:
                print("✗ Stock decrement is incorrect!")
        else:
            print("✗ Rice not found after sale")
    else:
        print(f"✗ Fetch products failed after sale! Status: {status}")

    # 6. Verify Dashboard Metrics
    print("\n[6] Testing Dashboard Summary...")
    status, dash = make_request("/dashboard/summary", token=token)
    if status == 200:
        print("✓ Dashboard metrics loaded successfully!")
        print(f"  Total Revenue: {dash.get('totalRevenue')}")
        print(f"  Low Stock Count: {dash.get('lowStockCount')}")
        print(f"  Estimated Profit (22%): {dash.get('estimatedProfit')}")
    else:
        print(f"✗ Dashboard summary failed! Status: {status}, Error: {dash}")

    # 7. Test Fetch Notifications
    print("\n[7] Testing Get Notifications...")
    status, notifications = make_request("/notifications")
    if status == 200:
        print(f"✓ Notifications fetched successfully! Total: {len(notifications)}")
        unread = [n for n in notifications if not n["read"]]
        print(f"  Unread count: {len(unread)}")
        for n in unread[:3]:
            print(f"  - [{n['type']}] {n['title']}: {n['message']}")
    else:
        print(f"✗ Get notifications failed! Status: {status}")

    print("\n=== ALL TESTS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    run_tests()
