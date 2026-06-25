# Arix.help — The AI Operating System for Developers

A production-ready SaaS platform that combines the best of **ChatGPT + Cursor + Replit + Codespaces + Vercel** into one AI-powered developer workspace.

> Upload projects, edit visually, chat with AI, fix bugs automatically, preview live, and deploy — without leaving the browser.

---

## ✨ Features

- 🤖 **Multi-model AI chat** — Claude Sonnet 4.5, GPT-5.2, Gemini 3 Pro (via Emergent Universal LLM Key)
- 🎨 **Premium dark-mode UI** — Cabinet Grotesk + JetBrains Mono, glassmorphism, micro-interactions
- 🗂️ **Monaco editor + file tree + tabs + Ctrl+S**
- 📺 **Live preview** with desktop/tablet/mobile responsive modes (HTML/CSS/JS sandboxed iframe)
- 🔐 **Dual auth** — email/password (JWT) **and** one-click Google OAuth (Emergent-managed)
- 🚀 **One-click deployment** (UI mocked; Vercel/Netlify/AWS targets)
- 💳 **Billing dashboard** (Free / Pro / Enterprise tiers)
- 📦 **14 framework templates** (React, Next.js, Vue, Nuxt, Svelte, Node, NestJS, FastAPI, Django, Flask, WordPress, Docker, RN, …)
- 👥 **Team management + Settings + API keys**
- 🛡️ **Admin panel** with platform stats

---

## ⚡ Quick start

```bash
bash setup.sh           # interactive setup wizard
bash setup.sh --start   # setup + start both services in background
```

The wizard will:
1. Check for Python 3.11+, Node 18+, Yarn, MongoDB
2. Prompt for env vars (MongoDB URL, DB name, JWT secret, Emergent LLM key, ports)
3. Write `backend/.env` and `frontend/.env`
4. Install backend (`pip`) + frontend (`yarn`) dependencies
5. Ping MongoDB
6. Optionally seed an admin user
7. Optionally start both services

---

## 🧱 Architecture

```
arix-help/
├── backend/                FastAPI + MongoDB
│   ├── server.py           All routes (/api/auth, /api/projects, /api/chats, …)
│   ├── requirements.txt
│   └── .env                MONGO_URL, DB_NAME, EMERGENT_LLM_KEY, JWT_SECRET
├── frontend/               React 19 + Tailwind + Monaco + Phosphor Icons
│   ├── src/
│   │   ├── App.js          Router + AuthCallback hash-routing
│   │   ├── contexts/AuthContext.jsx
│   │   ├── components/     DashboardLayout, ChatPanel, UploadDialog, ProtectedRoute
│   │   ├── lib/api.js      Axios client with token injection
│   │   └── pages/          Landing, Login, Signup, Dashboard, Projects, Workspace, Templates, Deployments, Billing, Team, Settings, Admin
│   └── package.json
├── design_guidelines.json  Source of truth for the dark/amber/Cabinet-Grotesk theme
├── setup.sh                One-shot setup wizard
└── README.md               (this file)
```

### Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19, react-router-dom 7, Tailwind 3, framer-motion, @monaco-editor/react, react-resizable-panels, react-markdown, @phosphor-icons/react, sonner, JSZip |
| Backend | FastAPI, motor (async Mongo), pydantic v2, bcrypt, pyjwt, emergentintegrations |
| DB | MongoDB |
| AI | Emergent Universal LLM Key (Anthropic / OpenAI / Gemini) |
| Auth | JWT + Emergent Google OAuth |

---

## 🔑 Environment variables

`backend/.env`:
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=arix_help
CORS_ORIGINS=*
EMERGENT_LLM_KEY=sk-emergent-...
JWT_SECRET=<openssl rand -hex 32>
JWT_ALGORITHM=HS256
```

`frontend/.env`:
```
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=3000
```

> **Emergent LLM Key**: covers Claude (text), GPT (text + image gen), Gemini (text + Nano Banana). Get yours from your Emergent profile → Universal Key.

---

## 🧪 Test users

| Email | Password | Role |
|---|---|---|
| `test.dev@arix.help` | `Arix2026!` | free |
| `admin@arix.help` | `AdminPass!2026` | admin (promote via mongo) |

Promote to admin:
```bash
mongosh --eval 'db.getSiblingDB("arix_help").users.updateOne({email:"admin@arix.help"},{$set:{role:"admin"}})'
```

---

## 🛣️ API endpoints (selected)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Email/password signup → JWT |
| POST | `/api/auth/login` | Email/password login → JWT |
| GET  | `/api/auth/me` | Current user (cookie or `Bearer`) |
| POST | `/api/auth/google/session` | Exchange Emergent `session_id` → cookie |
| POST | `/api/auth/logout` | Clear session |
| GET/POST/DELETE | `/api/projects[/{id}]` | CRUD projects |
| GET/POST/DELETE | `/api/projects/{id}/files` | CRUD files |
| GET/POST | `/api/chats[/{id}/messages]` | Chat + AI message |
| GET/POST | `/api/deployments` | Mocked deploy |
| GET  | `/api/templates` | Static template catalog |
| GET  | `/api/admin/stats` | Admin-only metrics |

---

## 🗺️ Roadmap

- [x] **Phase 1** — Auth, dashboard, uploads, AI chat, Monaco editor
- [x] **Phase 2** — Live preview, AI file editing, React/HTML support
- [ ] **Phase 3** — Real Docker sandbox runtime, WordPress, GitHub integration
- [ ] **Phase 4** — Real Stripe billing, team collaboration, real deploys
- [ ] **Phase 5** — Multi-agent AI, Kubernetes scaling, marketplace

---

## 🪪 License

Proprietary © 2026 Arix.help — All rights reserved.
