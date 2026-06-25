"""Arix.help backend — FastAPI + MongoDB.

Endpoints:
  - /api/auth/*  (register / login / me / logout / google session exchange)
  - /api/projects/*
  - /api/projects/{id}/files/*
  - /api/chats/*
  - /api/chats/{id}/messages
  - /api/deployments
  - /api/templates
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, UploadFile, File, Cookie, Header
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import bcrypt
import jwt as pyjwt
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta

from emergentintegrations.llm.chat import LlmChat, UserMessage

# Sub-routers (install wizard, integrations, diagnostics, backups)
from install import router as install_router
from integrations import router as integrations_router
from diagnostics import router as diagnostics_router
from backups import router as backups_router

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# --- Setup ---------------------------------------------------------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_DAYS = 7

app = FastAPI(title="Arix.help API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("arix")

# --- Models --------------------------------------------------------------
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: Literal["free", "pro", "enterprise", "admin"] = "free"
    auth_provider: Literal["password", "google"] = "password"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class GoogleSessionIn(BaseModel):
    session_id: str

class ProjectIn(BaseModel):
    name: str
    framework: str = "static"
    description: Optional[str] = ""

class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    project_id: str
    user_id: str
    name: str
    framework: str
    description: str = ""
    created_at: datetime
    updated_at: datetime

class FileIn(BaseModel):
    path: str
    content: str

class ProjectFile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    file_id: str
    project_id: str
    path: str
    content: str
    updated_at: datetime

class ChatIn(BaseModel):
    title: Optional[str] = "New Chat"
    project_id: Optional[str] = None

class Chat(BaseModel):
    model_config = ConfigDict(extra="ignore")
    chat_id: str
    user_id: str
    title: str
    project_id: Optional[str] = None
    created_at: datetime

class MessageIn(BaseModel):
    content: str
    model: Optional[str] = "claude-sonnet-4-5-20250929"  # provider derived below
    provider: Optional[str] = "anthropic"

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str
    chat_id: str
    role: Literal["user", "assistant", "system"]
    content: str
    model: Optional[str] = None
    created_at: datetime

class DeploymentIn(BaseModel):
    project_id: str
    target: str = "vercel"

# --- Helpers -------------------------------------------------------------
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False

def issue_jwt(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_DAYS),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def decode_jwt(token: str) -> Optional[str]:
    try:
        data = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        return data.get("sub")
    except Exception:
        return None

async def get_current_user(
    request: Request,
    session_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
) -> User:
    """Auth resolver: tries cookie session (Emergent Google) first then Bearer JWT."""
    # 1. Cookie session (Emergent Google Auth)
    if session_token:
        sess = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if sess:
            expires_at = sess["expires_at"]
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at >= datetime.now(timezone.utc):
                user_doc = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0, "password_hash": 0})
                if user_doc:
                    return User(**user_doc)

    # 2. Bearer JWT
    token: Optional[str] = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    if token:
        # Could be JWT or an Emergent session_token in Authorization header
        user_id = decode_jwt(token)
        if user_id:
            user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
            if user_doc:
                return User(**user_doc)
        # try session token in header
        sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
        if sess:
            user_doc = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0, "password_hash": 0})
            if user_doc:
                return User(**user_doc)
    raise HTTPException(status_code=401, detail="Not authenticated")

def now() -> datetime:
    return datetime.now(timezone.utc)

def iso(dt: datetime) -> str:
    return dt.isoformat()

# --- Auth endpoints ------------------------------------------------------
@api.post("/auth/register")
async def register(body: RegisterIn):
    existing = await db.users.find_one({"email": body.email.lower()}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    doc = {
        "user_id": user_id,
        "email": body.email.lower(),
        "name": body.name,
        "picture": None,
        "role": "free",
        "auth_provider": "password",
        "password_hash": hash_password(body.password),
        "created_at": iso(now()),
    }
    await db.users.insert_one(doc)
    token = issue_jwt(user_id)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if isinstance(user["created_at"], str):
        user["created_at"] = datetime.fromisoformat(user["created_at"])
    return {"token": token, "user": User(**user).model_dump(mode="json")}

@api.post("/auth/login")
async def login(body: LoginIn):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not user.get("password_hash") or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = issue_jwt(user["user_id"])
    user.pop("_id", None)
    user.pop("password_hash", None)
    if isinstance(user["created_at"], str):
        user["created_at"] = datetime.fromisoformat(user["created_at"])
    return {"token": token, "user": User(**user).model_dump(mode="json")}

@api.post("/auth/google/session")
async def google_session(body: GoogleSessionIn, response: Response):
    """Exchange Emergent Google Auth session_id for our session token."""
    headers = {"X-Session-ID": body.session_id}
    async with httpx.AsyncClient(timeout=15) as cx:
        r = await cx.get("https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data", headers=headers)
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    data = r.json()
    email = data["email"].lower()
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": data["name"], "picture": data.get("picture"), "auth_provider": "google"}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": data["name"],
            "picture": data.get("picture"),
            "role": "free",
            "auth_provider": "google",
            "created_at": iso(now()),
        })
    session_token = data["session_token"]
    expires_at = now() + timedelta(days=JWT_DAYS)
    await db.user_sessions.update_one(
        {"session_token": session_token},
        {"$set": {"user_id": user_id, "session_token": session_token, "expires_at": iso(expires_at), "created_at": iso(now())}},
        upsert=True,
    )
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=JWT_DAYS * 24 * 3600,
    )
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if isinstance(user_doc["created_at"], str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    return {"user": User(**user_doc).model_dump(mode="json"), "token": session_token}

@api.get("/auth/me")
async def me(user: User = Depends(get_current_user)):
    return user.model_dump(mode="json")

@api.post("/auth/logout")
async def logout(response: Response, session_token: Optional[str] = Cookie(default=None)):
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}

# --- Projects ------------------------------------------------------------
@api.get("/projects")
async def list_projects(user: User = Depends(get_current_user)):
    docs = await db.projects.find({"user_id": user.user_id}, {"_id": 0}).sort("updated_at", -1).to_list(500)
    for d in docs:
        for k in ("created_at", "updated_at"):
            if isinstance(d.get(k), str):
                d[k] = datetime.fromisoformat(d[k])
    return [Project(**d).model_dump(mode="json") for d in docs]

@api.post("/projects")
async def create_project(body: ProjectIn, user: User = Depends(get_current_user)):
    project_id = f"prj_{uuid.uuid4().hex[:12]}"
    n = now()
    doc = {
        "project_id": project_id,
        "user_id": user.user_id,
        "name": body.name,
        "framework": body.framework,
        "description": body.description or "",
        "created_at": iso(n),
        "updated_at": iso(n),
    }
    await db.projects.insert_one(doc)
    # Seed default files
    default_files = _starter_files(body.framework)
    for path_, content in default_files.items():
        await db.project_files.insert_one({
            "file_id": f"f_{uuid.uuid4().hex[:12]}",
            "project_id": project_id,
            "path": path_,
            "content": content,
            "updated_at": iso(n),
        })
    return Project(**{**doc, "created_at": n, "updated_at": n}).model_dump(mode="json")

@api.get("/projects/{project_id}")
async def get_project(project_id: str, user: User = Depends(get_current_user)):
    doc = await db.projects.find_one({"project_id": project_id, "user_id": user.user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    for k in ("created_at", "updated_at"):
        if isinstance(doc.get(k), str):
            doc[k] = datetime.fromisoformat(doc[k])
    return Project(**doc).model_dump(mode="json")

@api.delete("/projects/{project_id}")
async def delete_project(project_id: str, user: User = Depends(get_current_user)):
    res = await db.projects.delete_one({"project_id": project_id, "user_id": user.user_id})
    await db.project_files.delete_many({"project_id": project_id})
    return {"deleted": res.deleted_count}

@api.get("/projects/{project_id}/files")
async def list_files(project_id: str, user: User = Depends(get_current_user)):
    project = await db.projects.find_one({"project_id": project_id, "user_id": user.user_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    docs = await db.project_files.find({"project_id": project_id}, {"_id": 0}).to_list(2000)
    for d in docs:
        if isinstance(d.get("updated_at"), str):
            d["updated_at"] = datetime.fromisoformat(d["updated_at"])
    return [ProjectFile(**d).model_dump(mode="json") for d in docs]

@api.post("/projects/{project_id}/files")
async def upsert_file(project_id: str, body: FileIn, user: User = Depends(get_current_user)):
    project = await db.projects.find_one({"project_id": project_id, "user_id": user.user_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    existing = await db.project_files.find_one({"project_id": project_id, "path": body.path}, {"_id": 0})
    n = now()
    if existing:
        await db.project_files.update_one(
            {"project_id": project_id, "path": body.path},
            {"$set": {"content": body.content, "updated_at": iso(n)}},
        )
        existing["content"] = body.content
        existing["updated_at"] = n
        out = existing
    else:
        out = {
            "file_id": f"f_{uuid.uuid4().hex[:12]}",
            "project_id": project_id,
            "path": body.path,
            "content": body.content,
            "updated_at": iso(n),
        }
        await db.project_files.insert_one(out.copy())
        out["updated_at"] = n
    await db.projects.update_one({"project_id": project_id}, {"$set": {"updated_at": iso(n)}})
    return ProjectFile(**out).model_dump(mode="json")

@api.delete("/projects/{project_id}/files")
async def delete_file(project_id: str, path: str, user: User = Depends(get_current_user)):
    project = await db.projects.find_one({"project_id": project_id, "user_id": user.user_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    res = await db.project_files.delete_one({"project_id": project_id, "path": path})
    return {"deleted": res.deleted_count}

# --- Chats + AI ----------------------------------------------------------
@api.get("/chats")
async def list_chats(user: User = Depends(get_current_user)):
    docs = await db.chats.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])
    return [Chat(**d).model_dump(mode="json") for d in docs]

@api.post("/chats")
async def create_chat(body: ChatIn, user: User = Depends(get_current_user)):
    chat_id = f"chat_{uuid.uuid4().hex[:12]}"
    n = now()
    doc = {
        "chat_id": chat_id,
        "user_id": user.user_id,
        "title": body.title or "New Chat",
        "project_id": body.project_id,
        "created_at": iso(n),
    }
    await db.chats.insert_one(doc)
    return Chat(**{**doc, "created_at": n}).model_dump(mode="json")

@api.get("/chats/{chat_id}/messages")
async def get_messages(chat_id: str, user: User = Depends(get_current_user)):
    chat = await db.chats.find_one({"chat_id": chat_id, "user_id": user.user_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    docs = await db.chat_messages.find({"chat_id": chat_id}, {"_id": 0}).sort("created_at", 1).to_list(2000)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])
    return [ChatMessage(**d).model_dump(mode="json") for d in docs]

PROVIDER_MAP = {
    "claude-sonnet-4-5-20250929": "anthropic",
    "claude-haiku-4-5-20251001": "anthropic",
    "gpt-5.2": "openai",
    "gpt-5.1": "openai",
    "gemini-3.1-pro-preview": "gemini",
    "gemini-3-flash-preview": "gemini",
}

SYSTEM_PROMPT = (
    "You are Arix, an elite AI developer assistant inside Arix.help — an AI-powered developer workspace. "
    "You help users build, fix, refactor, and explain code. Be concise, precise, and pragmatic. "
    "Use markdown with fenced code blocks. Prefer modern frameworks (React, Next.js, FastAPI, Node) "
    "and modern best practices."
)

@api.post("/chats/{chat_id}/messages")
async def send_message(chat_id: str, body: MessageIn, user: User = Depends(get_current_user)):
    chat = await db.chats.find_one({"chat_id": chat_id, "user_id": user.user_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    model = body.model or "claude-sonnet-4-5-20250929"
    provider = body.provider or PROVIDER_MAP.get(model, "anthropic")

    n = now()
    user_msg = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "chat_id": chat_id,
        "role": "user",
        "content": body.content,
        "model": model,
        "created_at": iso(n),
    }
    await db.chat_messages.insert_one(user_msg.copy())

    # Get full history
    history_docs = await db.chat_messages.find({"chat_id": chat_id}, {"_id": 0}).sort("created_at", 1).to_list(200)

    # Auto-title from first user message
    if chat.get("title", "New Chat") == "New Chat":
        title = body.content[:60].strip().split("\n")[0] or "New Chat"
        await db.chats.update_one({"chat_id": chat_id}, {"$set": {"title": title}})

    try:
        ll = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=chat_id,
            system_message=SYSTEM_PROMPT,
        ).with_model(provider, model)
        # Replay only the latest user message; emergentintegrations session_id persists context
        response_text = await ll.send_message(UserMessage(text=body.content))
    except Exception as e:
        logger.exception("LLM call failed")
        response_text = f"_AI provider error: {str(e)[:200]}_"

    n2 = now()
    asst_msg = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "chat_id": chat_id,
        "role": "assistant",
        "content": response_text,
        "model": model,
        "created_at": iso(n2),
    }
    await db.chat_messages.insert_one(asst_msg.copy())

    user_msg["created_at"] = n
    asst_msg["created_at"] = n2
    return {
        "user_message": ChatMessage(**user_msg).model_dump(mode="json"),
        "assistant_message": ChatMessage(**asst_msg).model_dump(mode="json"),
    }

# --- Deployments (mocked) -----------------------------------------------
@api.get("/deployments")
async def list_deployments(user: User = Depends(get_current_user)):
    docs = await db.deployments.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs

@api.post("/deployments")
async def create_deployment(body: DeploymentIn, user: User = Depends(get_current_user)):
    project = await db.projects.find_one({"project_id": body.project_id, "user_id": user.user_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    dep_id = f"dep_{uuid.uuid4().hex[:10]}"
    n = now()
    url = f"https://{project['name'].lower().replace(' ', '-')}-{dep_id[-6:]}.arix.app"
    doc = {
        "deployment_id": dep_id,
        "user_id": user.user_id,
        "project_id": body.project_id,
        "project_name": project["name"],
        "target": body.target,
        "status": "ready",
        "url": url,
        "logs": [
            "[00:00] Cloning project files…",
            "[00:01] Installing dependencies (npm ci)",
            "[00:08] Building production bundle",
            "[00:14] Uploading assets to CDN",
            "[00:16] Provisioning SSL certificate",
            "[00:17] Deployment ready ✓",
        ],
        "created_at": iso(n),
    }
    await db.deployments.insert_one(doc.copy())
    doc.pop("_id", None)
    return doc

# --- Templates (static) --------------------------------------------------
TEMPLATES = [
    {"id": "static", "name": "HTML / CSS / JS", "framework": "static", "category": "Web", "stars": 1284, "description": "Vanilla starter, no build step."},
    {"id": "react", "name": "React + Vite", "framework": "react", "category": "Web", "stars": 5421, "description": "Modern React 19 + Vite scaffold."},
    {"id": "nextjs", "name": "Next.js 15", "framework": "nextjs", "category": "Web", "stars": 7330, "description": "App Router, RSC, Tailwind preset."},
    {"id": "vue", "name": "Vue 3", "framework": "vue", "category": "Web", "stars": 1893, "description": "Vue 3 Composition API + Vite."},
    {"id": "nuxt", "name": "Nuxt 3", "framework": "nuxt", "category": "Web", "stars": 1543, "description": "Nuxt 3 universal app."},
    {"id": "svelte", "name": "SvelteKit", "framework": "svelte", "category": "Web", "stars": 2102, "description": "SvelteKit lightweight starter."},
    {"id": "node", "name": "Node.js Express", "framework": "node", "category": "Backend", "stars": 3401, "description": "Express REST API boilerplate."},
    {"id": "nestjs", "name": "NestJS API", "framework": "nestjs", "category": "Backend", "stars": 1620, "description": "NestJS modular backend."},
    {"id": "fastapi", "name": "FastAPI Python", "framework": "fastapi", "category": "Backend", "stars": 4231, "description": "FastAPI + Pydantic v2."},
    {"id": "django", "name": "Django", "framework": "django", "category": "Backend", "stars": 2230, "description": "Django 5 starter project."},
    {"id": "flask", "name": "Flask", "framework": "flask", "category": "Backend", "stars": 1130, "description": "Flask minimal API."},
    {"id": "wordpress", "name": "WordPress Plugin", "framework": "wordpress", "category": "CMS", "stars": 542, "description": "Plugin boilerplate with hooks."},
    {"id": "docker", "name": "Docker Compose", "framework": "docker", "category": "DevOps", "stars": 1843, "description": "Multi-service compose template."},
    {"id": "react-native", "name": "React Native", "framework": "react-native", "category": "Mobile", "stars": 2241, "description": "Expo + RN starter."},
]

@api.get("/templates")
async def list_templates():
    return TEMPLATES

# --- Starter file generator ----------------------------------------------
def _starter_files(framework: str) -> dict:
    if framework in ("static",):
        return {
            "index.html": """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Hello from Arix.help</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <main>
    <h1>Welcome to <span>Arix.help</span></h1>
    <p>Edit <code>index.html</code> and see your live preview update instantly.</p>
    <button id="cta">Click me</button>
  </main>
  <script src="app.js"></script>
</body>
</html>
""",
            "styles.css": """:root { color-scheme: dark; }
* { box-sizing: border-box; }
body {
  margin: 0; min-height: 100vh;
  display: grid; place-items: center;
  background: #050505; color: #FAFAFA;
  font-family: 'Chivo', system-ui, sans-serif;
}
main { text-align: left; padding: 2rem; max-width: 540px; }
h1 { font-family: 'Cabinet Grotesk', sans-serif; font-weight: 900; font-size: clamp(2rem, 6vw, 3.5rem); letter-spacing: -0.03em; }
h1 span { color: #F59E0B; }
button { margin-top: 1.5rem; padding: .75rem 1.25rem; background: #F59E0B; color: #050505; border: 0; font-weight: 700; cursor: pointer; }
code { background: #1E1E1E; padding: .15rem .35rem; border: 1px solid rgba(255,255,255,.1); }
""",
            "app.js": """document.getElementById('cta').addEventListener('click', () => {
  alert('Hello from Arix.help workspace');
});
""",
        }
    if framework == "react":
        return {
            "package.json": '{\n  "name": "react-app",\n  "version": "0.1.0",\n  "dependencies": {"react":"^19.0.0","react-dom":"^19.0.0"}\n}\n',
            "src/App.jsx": "export default function App(){\n  return <h1>Hello React on Arix.help</h1>;\n}\n",
            "src/main.jsx": "import { createRoot } from 'react-dom/client';\nimport App from './App';\ncreateRoot(document.getElementById('root')).render(<App />);\n",
            "index.html": '<!doctype html><html><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>\n',
            "README.md": "# React + Vite Starter\n\nGenerated by Arix.help",
        }
    return {
        "README.md": f"# {framework} project\n\nGenerated by Arix.help",
        "index.html": "<!doctype html><html><body><h1>Arix.help starter</h1></body></html>",
    }

# --- Health --------------------------------------------------------------
@api.get("/")
async def root():
    return {"name": "Arix.help API", "ok": True, "time": iso(now())}

@api.get("/admin/stats")
async def admin_stats(user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    users = await db.users.count_documents({})
    projects = await db.projects.count_documents({})
    chats = await db.chats.count_documents({})
    deps = await db.deployments.count_documents({})
    return {"users": users, "projects": projects, "chats": chats, "deployments": deps}

app.include_router(api)
app.include_router(install_router)
app.include_router(integrations_router)
app.include_router(diagnostics_router)
app.include_router(backups_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown():
    client.close()
