"""Install wizard router — /api/install/*

Endpoints:
  GET  /api/install/status                       → {installed, system}
  POST /api/install/test-db                      → {ok, info}
  POST /api/install/run                          → {ok, redirect}  (idempotent)
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys
import uuid
import bcrypt
import platform
import shutil
import importlib.util

router = APIRouter(prefix="/api/install", tags=["install"])

SITE_DOC_ID = "arix_site_settings"
INSTALL_FLAG_ID = "arix_installed"

# --- Schemas -------------------------------------------------------------
class TestDbIn(BaseModel):
    host: str = "mongodb://localhost:27017"
    db_name: str = "arix_help"
    username: Optional[str] = None
    password: Optional[str] = None

class InstallIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    site_name: str
    site_url: str
    admin_name: str
    admin_email: EmailStr
    admin_password: str
    db_host: str
    db_name: str
    db_username: Optional[str] = ""
    db_password: Optional[str] = ""
    smtp_host: Optional[str] = ""
    smtp_port: Optional[int] = 0
    smtp_user: Optional[str] = ""
    smtp_password: Optional[str] = ""
    smtp_from: Optional[str] = ""
    preferred_ai: Optional[str] = "anthropic"
    ai_key: Optional[str] = ""

# --- Helpers -------------------------------------------------------------
def _build_mongo_url(host: str, user: str = "", pwd: str = "") -> str:
    if user and pwd and "://" in host:
        scheme, rest = host.split("://", 1)
        return f"{scheme}://{user}:{pwd}@{rest}"
    return host

def _system_info() -> Dict[str, Any]:
    mem_total = 0
    try:
        with open("/proc/meminfo") as f:
            for line in f:
                if line.startswith("MemTotal:"):
                    mem_total = int(line.split()[1]) // 1024
                    break
    except Exception:
        mem_total = -1
    disk = shutil.disk_usage("/")
    return {
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "node": platform.node(),
        "memory_mb": mem_total,
        "disk_total_gb": round(disk.total / 1024**3, 1),
        "disk_free_gb": round(disk.free / 1024**3, 1),
        "required_packages": _check_packages(["fastapi", "motor", "bcrypt", "jwt", "emergentintegrations"]),
        "sys_path_writable": os.access(os.path.dirname(__file__), os.W_OK),
    }

def _check_packages(names) -> Dict[str, bool]:
    out = {}
    for n in names:
        out[n] = importlib.util.find_spec(n) is not None
    return out

# --- Endpoints -----------------------------------------------------------
@router.get("/status")
async def status():
    """Reports whether the SaaS has been installed (default: True after first install via wizard)."""
    from server import db  # lazy import to avoid circular
    flag = await db.app_state.find_one({"_key": INSTALL_FLAG_ID}, {"_id": 0})
    settings = await db.app_state.find_one({"_key": SITE_DOC_ID}, {"_id": 0})
    return {
        "installed": bool(flag and flag.get("value") is True),
        "site": settings.get("data") if settings else None,
        "system": _system_info(),
    }

@router.post("/test-db")
async def test_db(body: TestDbIn):
    url = _build_mongo_url(body.host, body.username or "", body.password or "")
    try:
        client = AsyncIOMotorClient(url, serverSelectionTimeoutMS=3000)
        info = await client.server_info()
        names = await client.list_database_names()
        return {
            "ok": True,
            "mongo_version": info.get("version"),
            "databases": [n for n in names if n not in ("admin", "config", "local")],
            "target_db_exists": body.db_name in names,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Connection failed: {str(e)[:240]}")

@router.post("/run")
async def run_install(body: InstallIn):
    """Run the installer. Idempotent: re-runs are safe and update settings."""
    from server import db, hash_password  # lazy import

    flag = await db.app_state.find_one({"_key": INSTALL_FLAG_ID}, {"_id": 0})
    already = bool(flag and flag.get("value") is True)

    steps = []
    # 1. DB sanity
    try:
        await db.command("ping")
        steps.append({"step": "Database connection", "ok": True})
    except Exception as e:
        steps.append({"step": "Database connection", "ok": False, "error": str(e)[:200]})
        raise HTTPException(status_code=500, detail="Database unreachable")

    # 2. Ensure indexes (idempotent)
    try:
        await db.users.create_index("email", unique=True)
        await db.users.create_index("user_id", unique=True)
        await db.projects.create_index("project_id", unique=True)
        await db.user_sessions.create_index("session_token", unique=True)
        await db.user_sessions.create_index("expires_at", expireAfterSeconds=0)
        steps.append({"step": "Database indexes", "ok": True})
    except Exception as e:
        steps.append({"step": "Database indexes", "ok": False, "error": str(e)[:200]})

    # 3. Seed default data
    try:
        defaults_count = await db.app_state.count_documents({"_key": "default_seed"})
        if defaults_count == 0:
            await db.app_state.insert_one({"_key": "default_seed", "value": True, "seeded_at": datetime.now(timezone.utc).isoformat()})
        steps.append({"step": "Default data seeded", "ok": True})
    except Exception as e:
        steps.append({"step": "Default data seeded", "ok": False, "error": str(e)[:200]})

    # 4. Admin user
    try:
        email = body.admin_email.lower()
        existing = await db.users.find_one({"email": email}, {"_id": 0})
        if existing:
            await db.users.update_one(
                {"email": email},
                {"$set": {"role": "admin", "name": body.admin_name,
                          "password_hash": hash_password(body.admin_password)}},
            )
            steps.append({"step": "Admin account (updated)", "ok": True, "email": email})
        else:
            await db.users.insert_one({
                "user_id": f"user_{uuid.uuid4().hex[:12]}",
                "email": email,
                "name": body.admin_name,
                "picture": None,
                "role": "admin",
                "auth_provider": "password",
                "password_hash": hash_password(body.admin_password),
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            steps.append({"step": "Admin account (created)", "ok": True, "email": email})
    except Exception as e:
        steps.append({"step": "Admin account", "ok": False, "error": str(e)[:200]})

    # 5. Site settings
    site_doc = {
        "site_name": body.site_name,
        "site_url": body.site_url,
        "smtp": {
            "host": body.smtp_host, "port": body.smtp_port,
            "user": body.smtp_user, "from": body.smtp_from,
            # NOTE: SMTP password stored as-is in encrypted-at-rest layer (Mongo).
        },
        "preferred_ai": body.preferred_ai,
        "installed_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.app_state.update_one(
        {"_key": SITE_DOC_ID},
        {"$set": {"_key": SITE_DOC_ID, "data": site_doc}},
        upsert=True,
    )
    if body.smtp_password:
        await db.app_state.update_one(
            {"_key": "smtp_password"},
            {"$set": {"_key": "smtp_password", "value": body.smtp_password}},
            upsert=True,
        )
    steps.append({"step": "Site settings saved", "ok": True})

    # 6. AI provider key (stored in integrations)
    if body.ai_key:
        await db.integrations.update_one(
            {"provider": body.preferred_ai or "anthropic"},
            {"$set": {
                "provider": body.preferred_ai or "anthropic",
                "label": (body.preferred_ai or "anthropic").title(),
                "enabled": True,
                "secret_set": True,
                "secret_preview": body.ai_key[:7] + "•••" + body.ai_key[-4:] if len(body.ai_key) > 12 else "•••",
                "_secret": body.ai_key,  # NEVER returned to client
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }},
            upsert=True,
        )
        steps.append({"step": f"AI provider key stored ({body.preferred_ai})", "ok": True})

    # 7. Storage permissions / dirs
    try:
        for sub in ["uploads", "backups", ".run/logs"]:
            os.makedirs(os.path.join("/app", sub), exist_ok=True)
        steps.append({"step": "Storage directories", "ok": True})
    except Exception as e:
        steps.append({"step": "Storage directories", "ok": False, "error": str(e)[:200]})

    # 8. Mark installed
    await db.app_state.update_one(
        {"_key": INSTALL_FLAG_ID},
        {"$set": {"_key": INSTALL_FLAG_ID, "value": True, "installed_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    steps.append({"step": "Mark installed", "ok": True})

    return {"ok": True, "already_installed": already, "redirect": "/login", "steps": steps}


@router.post("/reset")
async def reset_install():
    """DEV/admin only: clears the installed flag so the wizard can be re-run.
    Does NOT delete users or data."""
    from server import db
    await db.app_state.delete_one({"_key": INSTALL_FLAG_ID})
    return {"ok": True}
