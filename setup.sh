#!/usr/bin/env bash
# ========================================================================
#  Arix.help — One-shot setup wizard
#  Usage:  bash setup.sh
#  Detects OS, installs all deps, prompts for env vars, seeds defaults,
#  and starts both backend (uvicorn) and frontend (CRA) in the background.
# ========================================================================
set -e

CYAN="\033[36m"; YEL="\033[33m"; GRN="\033[32m"; RED="\033[31m"; DIM="\033[2m"; RST="\033[0m"
say()   { echo -e "${CYAN}▸${RST} $1"; }
ok()    { echo -e "${GRN}✓${RST} $1"; }
warn()  { echo -e "${YEL}!${RST} $1"; }
fail()  { echo -e "${RED}✗${RST} $1"; exit 1; }
prompt(){ local v; read -r -p "$(echo -e "${YEL}?${RST} $1 ${DIM}[$2]${RST}: ")" v; echo "${v:-$2}"; }

banner() {
cat <<'EOF'
   _____         _         __                __
  / ____|       (_)       / /               / /
 | (___    _ __  _  __  __  / /__   ___  _ __  / /
  \___ \  | '__|| | \ \/ / / / _ \ / _ \| '_ \/ /
  ____) | | |   | |  >  < / / (_) | (_) | |_) | |
 |_____/  |_|   |_| /_/\_\/_/ \___/ \___/| .__/|_|
                                          | |
   The AI Operating System for Developers |_|
EOF
echo
}

banner

# 1. Prerequisites
say "Checking prerequisites…"
command -v python3 >/dev/null || fail "python3 not found. Install Python 3.11+ first."
command -v node    >/dev/null || fail "node not found. Install Node 18+ first."
command -v yarn    >/dev/null || { npm i -g yarn || fail "yarn not found and npm not available."; }
command -v mongod  >/dev/null || warn "mongod not found locally — make sure you have a MongoDB URL ready."
ok "Prerequisites OK"

# 2. Working directory
ROOT="$(cd "$(dirname "$0")" && pwd)"
[ -d "$ROOT/backend" ] && [ -d "$ROOT/frontend" ] || fail "Run setup.sh from the repo root (must contain ./backend and ./frontend)."

# 3. Env vars
say "Configuring environment…"
MONGO_URL_DEFAULT="mongodb://localhost:27017"
MONGO_URL=$(prompt "MongoDB URL" "$MONGO_URL_DEFAULT")
DB_NAME=$(prompt "Mongo database name" "arix_help")
EMERGENT_LLM_KEY=$(prompt "EMERGENT_LLM_KEY (leave blank for offline mode)" "")
JWT_SECRET=$(prompt "JWT secret (auto-generated)" "$(openssl rand -hex 32 2>/dev/null || date +%s%N)")
BACKEND_PORT=$(prompt "Backend port" "8001")
FRONTEND_PORT=$(prompt "Frontend port" "3000")
PUBLIC_URL=$(prompt "Public frontend URL (used by CRA REACT_APP_BACKEND_URL)" "http://localhost:$BACKEND_PORT")

cat > "$ROOT/backend/.env" <<EOF
MONGO_URL="$MONGO_URL"
DB_NAME="$DB_NAME"
CORS_ORIGINS="*"
EMERGENT_LLM_KEY=$EMERGENT_LLM_KEY
JWT_SECRET=$JWT_SECRET
JWT_ALGORITHM=HS256
EOF
ok "backend/.env written"

cat > "$ROOT/frontend/.env" <<EOF
REACT_APP_BACKEND_URL=$PUBLIC_URL
WDS_SOCKET_PORT=$FRONTEND_PORT
ENABLE_HEALTH_CHECK=false
EOF
ok "frontend/.env written"

# 4. Install backend
say "Installing backend (pip)…"
(
  cd "$ROOT/backend"
  python3 -m venv .venv 2>/dev/null || true
  # shellcheck disable=SC1091
  source .venv/bin/activate 2>/dev/null || true
  pip install --quiet --upgrade pip
  pip install --quiet -r requirements.txt
  # emergentintegrations needs custom index
  pip install --quiet emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/ 2>/dev/null || warn "emergentintegrations not installed (offline?). AI features will be limited."
)
ok "Backend dependencies installed"

# 5. Install frontend
say "Installing frontend (yarn)…"
(
  cd "$ROOT/frontend"
  yarn install --silent
)
ok "Frontend dependencies installed"

# 6. Mongo sanity
say "Pinging Mongo…"
python3 - <<PY || warn "Mongo not reachable. Start it and re-run setup."
import os, sys
try:
    from pymongo import MongoClient
    MongoClient("$MONGO_URL", serverSelectionTimeoutMS=2500).admin.command("ping")
    print("ok")
except Exception as e:
    print(f"FAIL: {e}", file=sys.stderr); sys.exit(1)
PY
ok "Mongo reachable"

# 7. Seed an admin user (optional)
SEED_ADMIN=$(prompt "Seed an admin user now? (y/N)" "N")
if [[ "$SEED_ADMIN" =~ ^[Yy] ]]; then
  ADMIN_EMAIL=$(prompt "Admin email" "admin@arix.help")
  ADMIN_PASS=$(prompt "Admin password" "AdminPass!2026")
  ADMIN_NAME=$(prompt "Admin name" "Arix Admin")
  python3 - <<PY
import os, uuid, bcrypt
from datetime import datetime, timezone
from pymongo import MongoClient
db = MongoClient("$MONGO_URL")["$DB_NAME"]
existing = db.users.find_one({"email":"$ADMIN_EMAIL"})
if existing:
    db.users.update_one({"email":"$ADMIN_EMAIL"}, {"\$set":{"role":"admin"}})
    print("Promoted existing user to admin.")
else:
    pw = bcrypt.hashpw("$ADMIN_PASS".encode(), bcrypt.gensalt()).decode()
    db.users.insert_one({
        "user_id": f"user_{uuid.uuid4().hex[:12]}",
        "email": "$ADMIN_EMAIL",
        "name": "$ADMIN_NAME",
        "role": "admin",
        "auth_provider": "password",
        "password_hash": pw,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    print("Created admin user $ADMIN_EMAIL.")
PY
fi

# 8. Run
echo
say "All set! To run Arix.help in dev mode:"
echo -e "  ${DIM}# In one terminal:${RST}"
echo -e "  ${GRN}cd backend && source .venv/bin/activate && uvicorn server:app --reload --host 0.0.0.0 --port $BACKEND_PORT${RST}"
echo -e "  ${DIM}# In another terminal:${RST}"
echo -e "  ${GRN}cd frontend && yarn start${RST}"
echo
say "Or run ${CYAN}bash setup.sh --start${RST} to launch both in the background."

if [[ "${1:-}" == "--start" ]]; then
  mkdir -p "$ROOT/.run/logs"
  (cd "$ROOT/backend" && source .venv/bin/activate && nohup uvicorn server:app --host 0.0.0.0 --port "$BACKEND_PORT" > "$ROOT/.run/logs/backend.log" 2>&1 & echo $! > "$ROOT/.run/backend.pid")
  (cd "$ROOT/frontend" && nohup yarn start > "$ROOT/.run/logs/frontend.log" 2>&1 & echo $! > "$ROOT/.run/frontend.pid")
  ok "Backend → http://localhost:$BACKEND_PORT/api/  (PID $(cat $ROOT/.run/backend.pid))"
  ok "Frontend → http://localhost:$FRONTEND_PORT     (PID $(cat $ROOT/.run/frontend.pid))"
  echo -e "${DIM}Tail logs:  tail -f $ROOT/.run/logs/*.log${RST}"
fi

ok "Done. Happy shipping with Arix.help"
