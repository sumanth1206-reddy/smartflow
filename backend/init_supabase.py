import os
import sys
from backend.app import create_app
from backend.extensions import db
from backend.services.db_seeder import seed_db

def main():
    app = create_app()
    with app.app_context():
        db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        
        if '[YOUR-PASSWORD]' in db_uri or 'your_supabase_password' in db_uri:
            print("\n[!] PASSWORD REQUIRED: Placeholder '[YOUR-PASSWORD]' found in backend/.env!")
            print("--> Please open backend/.env and replace [YOUR-PASSWORD] with your actual Supabase database password.\n")
            sys.exit(1)
            
        host_info = db_uri.split('@')[-1] if '@' in db_uri else db_uri
        print(f"Connecting to database target: {host_info}")
        print("Creating all database tables on Supabase PostgreSQL...")
        try:
            db.create_all()
            print("[+] All tables created successfully!")

            # Enable Row Level Security (RLS) on all public tables to satisfy Supabase security linter
            tables = ['users', 'products', 'categories', 'suppliers', 'inventory', 'sales', 'orders', 'notifications', 'settings']
            for table in tables:
                try:
                    db.session.execute(db.text(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;"))
                except Exception:
                    pass
            db.session.commit()
            print("[+] Row Level Security (RLS) enabled on all public tables!")

            print("Seeding initial database data...")
            seed_db()
            print("[+] Database seeded successfully!")
            print("\n[SUCCESS] Supabase Database setup complete!")
        except Exception as e:
            err_str = str(e)
            if "password authentication failed" in err_str:
                print("\n[ERROR] Password Authentication Failed!")
                print("Supabase rejected the password provided in backend/.env.")
                print("\nTo fix this:")
                print("1. Open backend/.env")
                print("2. Replace [YOUR-PASSWORD] in DATABASE_URL with your actual database password.")
                print("3. If you forgot your database password, reset it in Supabase Dashboard -> Project Settings -> Database -> Reset Database Password.\n")
            else:
                print(f"\n[ERROR] Connection Error: {e}\n")
            sys.exit(1)

if __name__ == '__main__':
    main()



