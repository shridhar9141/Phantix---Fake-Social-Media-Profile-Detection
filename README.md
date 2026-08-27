# IdentityTrace — Production-Style AI Cybersecurity Investigation Platform

IdentityTrace is an AI-assisted cybersecurity threat analysis and investigation platform. Authenticated security analysts can submit target URLs to automatically classify entity types (social media profile vs general web domain), extract technical and content risk signals, calculate explainable risk scores, detect entity relationships across past investigations, and visualize threat networks.

---

## 🌟 Key Features

1. **Authentication & User Isolation**:
   - Integrated with Firebase Authentication (Email/Password & Google OAuth 2.0).
   - Backend verifies Firebase ID tokens on protected API routes (`Bearer <token>`).
   - Every analyst's investigation data, dashboard metrics, and entity graphs remain completely isolated per `user_id`.

2. **Automated URL Classification**:
   - Accepts raw URLs, normalizes them, and auto-detects entity type (`SOCIAL_PROFILE` vs `WEBSITE`).
   - Built-in platform mapping for Instagram, X/Twitter, Facebook, LinkedIn, GitHub, TikTok, Reddit, and general web domains.

3. **Multi-Signal Threat Analysis Pipeline**:
   - **URL Structure**: Length, subdomain nesting levels, IP-based hostname detection, high-risk TLDs, typosquatting/brand similarity.
   - **Technical & Domain**: HTTPS/TLS verification, HTTP status code checks, multi-hop redirect chains.
   - **Content & Page**: SSRF-safe DOM page parsing, credential form detection (`<input type="password">`), brand title mismatches, urgency/phishing keyword indicators.
   - **Profile & Identity**: Social profile handle parsing, official/support spoofing cues, numerical bot pattern detection.
   - **Threat Intelligence Integrations**: VirusTotal & Google Safe Browsing API hooks (records explicitly `UNAVAILABLE` if unconfigured).

4. **Explainable Risk Engine**:
   - Reproducible rule-based weighted risk calculation (0–100 score).
   - Categorized Risk Levels:
     - `0–29`: LOW RISK
     - `30–59`: MEDIUM RISK
     - `60–79`: HIGH RISK
     - `80–100`: CRITICAL RISK
   - Itemized signal impact list explaining exact risk drivers.

5. **Entity Connection Graph (Cytoscape.js)**:
   - Scans user's historical entities to detect real technical and brand relationships (shared root domain, redirect target link, brand name overlap, indicator overlap).
   - Interactive network visualizer featuring node risk color coding, side panel drawers, zoom/pan controls, and type/risk level filters.

6. **Zero-Demo Real Data Integrity**:
   - Newly registered users start with zero pre-populated records or fake data.
   - Professional empty states guide the analyst to initiate their first investigation.

---

## 🏗️ Architecture

```text
identitytrace/
│
├── frontend/                     # React + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/           # UI, Layout, Investigation, & Network components
│   │   ├── contexts/             # AuthContext (Firebase + Backend sync)
│   │   ├── pages/                # Login, Register, Dashboard, NewInvestigation, Details, History, Network, Profile, Settings
│   │   ├── services/             # API client & Firebase Auth initialization
│   │   └── types/                # TypeScript interfaces
│   ├── Dockerfile
│   └── vite.config.ts
│
├── backend/                      # FastAPI + SQLAlchemy + Pydantic
│   ├── app/
│   │   ├── analyzers/            # Classifier, Website Analyzer, Social Analyzer, Reputation
│   │   ├── api/v1/               # Auth, Investigations, Dashboard, Network endpoints
│   │   ├── connections/          # Relationship detection engine
│   │   ├── core/                 # Config, Database, Security, SSRF prevention
│   │   ├── models/               # SQLAlchemy ORM schemas
│   │   ├── schemas/              # Pydantic validation schemas
│   │   ├── scoring/              # Risk engine calculation
│   │   └── main.py               # FastAPI application entrypoint
│   ├── Dockerfile
│   └── requirements.txt
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query (v5), Cytoscape.js, Lucide Icons, Firebase Auth SDK.
- **Backend**: Python 3.13, FastAPI, SQLAlchemy 2.0, Pydantic v2, PyJWT, Beautiful Soup 4, tldextract, HTTPX.
- **Database**: PostgreSQL (Production) / SQLite (Zero-config local development).

---

## ⚡ Quick Start

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

The backend server will run at `http://localhost:8000`. Interactive OpenAPI documentation is accessible at `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The Vite frontend will launch at `http://localhost:5173`.

---

## 🐳 Running with Docker Compose

To launch the full production environment (PostgreSQL + FastAPI Backend + React Nginx Frontend) with a single command:

```bash
docker-compose up --build
```

Access:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

---

## 🔒 Security Protections

- **SSRF Prevention**: All outbound HTTP requests pass through `validate_url_safety()`, which resolves hostnames and blocks requests targeting loopback addresses (`127.0.0.1`), private networks (`10.0.0.0/8`, `192.168.0.0/16`), or cloud metadata endpoints (`169.254.169.254`).
- **Data Isolation**: All database queries filter strictly on `Investigation.user_id == current_user.id`.
- **Token Verification**: Backend API decodes and verifies Firebase ID tokens for every protected endpoint.
