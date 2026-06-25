"""Backup + Update Manager — /api/backups/* /api/updates/*

Backups are stored as JSON snapshots of all Mongo collections (no _id) under /app/backups.
This is suitable for self-hosted SaaS; replace with mongodump for production scale.

Updates are simulated (the platform vendor publishes a manifest); a real update flow would:
  1. Snapshot current backup
  2. git pull / docker pull
  3. Restart services
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import os, json, uuid, shutil

router = APIRouter(prefix="/api", tags=["backups"])

BACKUP_DIR = "/app/backups"
COLLECTIONS = ["users", "projects", "project_files", "chats", "chat_messages",
               "deployments", "integrations", "app_state", "user_sessions"]

os.makedirs(BACKUP_DIR, exist_ok=True)

class BackupIn(BaseModel):
    name: Optional[str] = None

# --- Backups -------------------------------------------------------------
@router.get("/backups")
async def list_backups():
    items = []
    for fn in sorted(os.listdir(BACKUP_DIR), reverse=True):
        if not fn.endswith(".json"):
            continue
        path = os.path.join(BACKUP_DIR, fn)
        st = os.stat(path)
        items.append({
            "id": fn[:-5],
            "name": fn,
            "size_kb": round(st.st_size / 1024, 1),
            "created_at": datetime.fromtimestamp(st.st_mtime, tz=timezone.utc).isoformat(),
        })
    return items

@router.post("/backups")
async def create_backup(body: BackupIn):
    from server import db
    snapshot = {"version": 1, "created_at": datetime.now(timezone.utc).isoformat(), "collections": {}}
    for c in COLLECTIONS:
        docs = await db[c].find({}, {"_id": 0}).to_list(100000)
        snapshot["collections"][c] = docs
    backup_id = body.name or f"backup_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
    safe = "".join(ch for ch in backup_id if ch.isalnum() or ch in "_-")
    path = os.path.join(BACKUP_DIR, f"{safe}.json")
    with open(path, "w") as f:
        json.dump(snapshot, f, default=str)
    st = os.stat(path)
    return {
        "id": safe,
        "name": f"{safe}.json",
        "size_kb": round(st.st_size / 1024, 1),
        "collections": {c: len(snapshot["collections"][c]) for c in COLLECTIONS},
        "created_at": snapshot["created_at"],
    }

@router.post("/backups/{backup_id}/restore")
async def restore_backup(backup_id: str):
    from server import db
    safe = "".join(ch for ch in backup_id if ch.isalnum() or ch in "_-")
    path = os.path.join(BACKUP_DIR, f"{safe}.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Backup not found")
    with open(path) as f:
        snap = json.load(f)
    restored = {}
    for c, docs in snap.get("collections", {}).items():
        await db[c].delete_many({})
        if docs:
            await db[c].insert_many(docs)
        restored[c] = len(docs)
    return {"ok": True, "restored": restored, "from": backup_id}

@router.delete("/backups/{backup_id}")
async def delete_backup(backup_id: str):
    safe = "".join(ch for ch in backup_id if ch.isalnum() or ch in "_-")
    path = os.path.join(BACKUP_DIR, f"{safe}.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Not found")
    os.remove(path)
    return {"ok": True}

# --- Updates -------------------------------------------------------------
CURRENT_VERSION = "1.0.0"
AVAILABLE_VERSION = "1.0.0"  # Bump on real release

@router.get("/updates/status")
async def update_status():
    return {
        "current_version": CURRENT_VERSION,
        "available_version": AVAILABLE_VERSION,
        "update_available": AVAILABLE_VERSION != CURRENT_VERSION,
        "channel": "stable",
        "last_checked": datetime.now(timezone.utc).isoformat(),
    }

@router.post("/updates/run")
async def run_update():
    """Mock update flow: backup → simulate fetch → ready."""
    from server import db
    # 1. Snapshot first
    snapshot = {"version": 1, "created_at": datetime.now(timezone.utc).isoformat(), "collections": {}}
    for c in COLLECTIONS:
        snapshot["collections"][c] = await db[c].find({}, {"_id": 0}).to_list(100000)
    safe = f"preupdate_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
    with open(os.path.join(BACKUP_DIR, f"{safe}.json"), "w") as f:
        json.dump(snapshot, f, default=str)

    steps = [
        {"step": "Create pre-update backup", "ok": True},
        {"step": "Fetch update manifest", "ok": True},
        {"step": "Verify checksums", "ok": True},
        {"step": "Apply migrations", "ok": True},
        {"step": "Restart services", "ok": True, "note": "skipped in dev preview"},
    ]
    return {"ok": True, "from": CURRENT_VERSION, "to": AVAILABLE_VERSION, "steps": steps, "backup_id": safe}
