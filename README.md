# Phantix — Fake Social Media Profile Detection & AI Threat Intelligence Platform

Phantix is an AI-assisted cybersecurity threat analysis and investigation platform designed to detect fake social media accounts, impersonators, bot clusters, and malicious web domains.

---

## 🏗️ Production Single-URL Architecture

Phantix deploys as a **unified, single-domain web application** with **ONE public URL**:

```text
                                INTERNET
                                   │
                                   ▼
               ONE PUBLIC DOMAIN (https://YOUR-PHANTIX-DOMAIN)
                                   │
                                   ▼
                            RAILWAY SERVICE
                                   │
                ┌──────────────────┴──────────────────┐
                │                                     │
         Static & SPA Routes                     API Routes
         (/, /dashboard, /assets/*)            (/api/v1/*, /health)
                │                                     │
                ▼                                     ▼
       React 18 Production SPA                  FastAPI 0.115
       (Compiled Vite Bundle)             (Detection & Risk Engines)
                │                                     │
                └──────────────────┬──────────────────┘
                                   │
                                   ▼
                          PostgreSQL Database
                         (Railway Managed DB)
```

### Authentication Flow

```text
React Client (Frontend)
   │
   ▼
Firebase Authentication (Email/Password or Google OAuth)
   │
   ▼
Firebase ID Token (Bearer Token)
   │
   ▼
FastAPI Backend (/api/v1/*)
   │
   ▼
Verify Firebase ID Token & Extract UID
   │
   ▼
PostgreSQL Database (Isolated per user_id)
```

---

## 🌟 Key Features

1. **One-URL Single-Domain Deployment**:
   - Single public domain in production (e.g. `https://phantix-production.up.railway.app`).
   - FastAPI serves the compiled React Single Page Application (SPA) with seamless client-side routing on refresh (`/dashboard`, `/investigations`, `/network`, `/reports`, `/complaints`, `/settings`).
   - API endpoints are mounted on same-origin `/api/v1/*`.

2. **Real Profile & Website Detection Engine**:
   - Analyzes username syntax, display name impersonation keywords, follower/following ratios, and external links in bio.
   - Computes image perceptual hashes (dHash) to detect avatar re-use across handles.
   - Normalizes input URLs and verifies domain safety via SSRF-safe HTTP resolution.

3. **Multi-Signal Explainable Risk Engine**:
   - Calculates deterministic, reproducible risk score (0–100) and risk level:
     - `0–29`: LOW RISK
     - `30–59`: MEDIUM RISK
     - `60–79`: HIGH RISK
     - `80–100`: CRITICAL RISK
   - Clear distinction between `AVAILABLE` signals and `UNAVAILABLE` metrics (zero fabricated metrics).

4. **Forensic Report Generation & Legal Complaint Workflow**:
   - Generates printable forensic investigation reports with formal disclaimers and limitations.
   - Generates legal grievance drafts with selected evidence items and user confirmation declarations.

5. **Entity Connection Graph (Cytoscape.js)**:
   - Visualizes real relationship clusters (shared domain, redirect chains, handle similarity, avatar re-use).

6. **Strict Multi-Tenant User Isolation**:
   - Every analyst's investigation records, dashboard stats, network nodes, and reports are strictly scoped to their `user_id`.

---

## 🚀 Deploy Phantix to Railway (Step-by-Step)

Follow these steps to deploy Phantix to Railway in under 5 minutes:

### Step 1: Push Code to GitHub
Ensure the latest code is pushed to your GitHub repository:
```bash
git push origin main
```

### Step 2: Create a Railway Project
1. Log in to [Railway.app](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your repository: `shridhar9141/Phantix---Fake-Social-Media-Profile-Detection`.

### Step 3: Add a PostgreSQL Database
1. In your Railway project canvas, click **+ New** → **Database** → **Add PostgreSQL**.
2. Railway will automatically provision a managed PostgreSQL database.

### Step 4: Configure Environment Variables
In your Railway Service settings, go to the **Variables** tab and add the following:

| Variable | Value | Notes |
| :--- | :--- | :--- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Connects service to Railway PostgreSQL |
| `PORT` | `8000` | Port for FastAPI |
| `ENVIRONMENT` | `production` | Production mode |
| `FIREBASE_PROJECT_ID` | `fake-social-media-detect-4bf0a` | Your Firebase Project ID |
| `JWT_SECRET_KEY` | *(Generate a random 64-char string)* | Application secret |
| `VITE_API_BASE_URL` | `/api/v1` | Same-origin API endpoint |
| `VITE_FIREBASE_API_KEY` | *(Your Firebase Web API Key)* | From Firebase Console |
| `VITE_FIREBASE_AUTH_DOMAIN` | `fake-social-media-detect-4bf0a.firebaseapp.com` | From Firebase Console |
| `VITE_FIREBASE_PROJECT_ID` | `fake-social-media-detect-4bf0a` | From Firebase Console |
| `VITE_FIREBASE_STORAGE_BUCKET` | `fake-social-media-detect-4bf0a.firebasestorage.app` | From Firebase Console |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `382068959219` | From Firebase Console |
| `VITE_FIREBASE_APP_ID` | `1:382068959219:web:f01741f1c608c82ecf9486` | From Firebase Console |

### Step 5: Deploy the Service
1. Railway will automatically detect the root multi-stage [`Dockerfile`](file:///e:/Phantix%20%E2%80%93%20Fake%20Social%20Media%20Profile%20Detection/Dockerfile) and build the application.
2. In **Settings** → **Networking**, click **Generate Domain** to assign a public domain (e.g. `https://phantix-production.up.railway.app`).

### Step 6: Configure Firebase Authorized Domains
To enable Google Login and Email Authentication on your Railway domain:
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: **fake-social-media-detect-4bf0a**.
3. Navigate to **Authentication** → **Settings** → **Authorized domains**.
4. Click **Add domain** and enter your Railway domain (e.g. `phantix-production.up.railway.app` or your custom domain).
5. Click **Save**.

### Step 7: Custom Domain Setup (Optional)
1. In Railway Settings → **Networking** → **Custom Domain**, enter your domain (e.g. `phantix.example.com`).
2. Configure the provided `CNAME` records in your DNS provider (Cloudflare, Namecheap, GoDaddy).
3. Add the custom domain to Firebase **Authorized domains** as described in Step 6.

---

## 🧪 Live Verification & Acceptance Test Suite

Run the full local test suite before or after deployment:

```bash
cd backend
python test_all_features.py
python test_reports_complaints.py
```

### Health Check Endpoints
- **Liveness Probe**: `GET /health` → `{"status": "ok", "service": "Phantix Fake Social Media Profile Detection", "version": "1.0.0"}`
- **Readiness Probe**: `GET /health/ready` → `{"status": "ready", "database": "connected"}`

---

## 💻 Local Development

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL (or local instance)

### Option A: Local Dev Servers (with hot reloading)

1. **Start Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python -m uvicorn app.main:app --reload --port 8000
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:5173`.

### Option B: Docker Compose (Unified Container)
```bash
docker-compose up --build
```
Open `http://localhost:8000`.

---

## 🔒 Security Summary

- **Single Domain**: No permissive wildcard CORS needed in production.
- **SSRF Safe**: Validates destination IP addresses against RFC-1918 private ranges, loopbacks, and cloud metadata IPs (`169.254.169.254`).
- **Cryptographic User Scoping**: Queries are bounded by verified `firebase_uid`.
- **Zero Mock / Demo Data**: Production boots with an empty database; users populate their own verified threat investigations.
