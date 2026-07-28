# 🚀 SmartFlow Deployment Guide

This guide details how to deploy the SmartFlow Inventory Management System (Frontend + Flask Backend + Supabase PostgreSQL Database).

---

## 1. Database (Supabase PostgreSQL)

Your database tables and initial data are configured and seeded on Supabase PostgreSQL.

- **Supabase Dashboard**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
- **Database Connection String**:
  `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
- **Table Initialization Command**:
  ```bash
  python -m backend.init_supabase
  ```

---

## 2. Backend Deployment Options

### Option A: Render (Recommended - Free Tier)

1. Push your repository to **GitHub**.
2. Go to **[Render.com](https://render.com)** and sign in.
3. Click **New +** -> **Blueprints**.
4. Connect your GitHub repository. Render will automatically detect `render.yaml`.
5. Fill in the Environment Variables when prompted:
   - `DATABASE_URL`: `postgresql://postgres.osvxnbwzkduncrrjydfp:[YOUR-PASSWORD]@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres`
6. Click **Apply**. Render will automatically deploy the backend API.

---

### Option B: Railway / Render Manual Web Service

1. Create a **New Web Service** on Render or Railway.
2. Set Root Directory: `backend`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `gunicorn app:app`
5. Add Environment Variables:
   - `DATABASE_URL`: `postgresql://...`
   - `JWT_SECRET_KEY`: `your-random-secret-key`
   - `SECRET_KEY`: `your-random-secret-key`
   - `PORT`: `5000`

---

## 3. Frontend Deployment Options

### Option A: Vercel (Recommended)

1. Go to **[Vercel.com](https://vercel.com)** and sign in with GitHub.
2. Click **Add New** -> **Project**.
3. Import your `SMARTFLOW` GitHub repository.
4. Framework Preset: **Vite**
5. Root Directory: `./`
6. Build Command: `cd frontend && npm install && npm run build`
7. Output Directory: `frontend/dist`
8. Add Environment Variable:
   - `VITE_API_URL`: `https://your-backend-service.onrender.com/api`
9. Click **Deploy**.

---

## 🛠 Production Environment Variables Summary

### Backend (.env)
```env
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
JWT_SECRET_KEY=super-secret-jwt-key
SECRET_KEY=super-secret-flask-key
FLASK_DEBUG=0
PORT=5000
```

### Frontend (.env.production)
```env
VITE_API_URL=https://your-backend-api-url.onrender.com/api
```
