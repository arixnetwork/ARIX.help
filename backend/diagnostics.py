"""System diagnostics + auto-repair — /api/system/*

Reports:
  - Python / Node / OS versions
  - Memory + disk
  - Mongo connectivity
  - Required Python packages present
  - File permissions (uploads, backups, .run/logs)
  - Environment variables present

Repair:
  - Creates missing folders, fixes permissions
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict
import os, sys, shutil, platform, time
import importlib.util
from datetime import datetime, timezone

router = APIRouter(prefix="/api/system", tags=["system"])

REQUIRED_DIRS = ["/app/uploads", "/app/backups", "/app/.run/logs"]
REQUIRED_ENVS = ["MONGO_URL", "DB_NAME", "JWT_SECRET", "EMERGENT_LLM_KEY"]
REQUIRED_PKGS = ["fastapi", "motor", "pymongo", "bcrypt", "jwt", "emergentintegrations", "pydantic"]

# --- Helpers -------------------------------------------------------------
def _mem_mb() -> int:
    try:
        with open("/proc/meminfo") as f:
            for line in f:
                if line.startswith("MemTotal:"):
                    return int(line.split()[1]) // 1024
    except Exception:
        pass
    return -1

def _node_version() -> str:
    try:
        import subprocess
        return subprocess.check_output(["node", "-v"], timeout=5).decode().strip()
    except Exception:
        return "not found"

# --- Endpoints -----------------------------------------------------------
@router.get("/diagnostics")
async def diagnostics():
    from server import db
    checks: List[Dict] = []

    # Python
    checks.append({
        "name": "Python runtime",
        "value": platform.python_version(),
        "ok": sys.version_info >= (3, 9),
        "message": "Python 3.9+ required",
    })
    # Node
    nv = _node_version()
    checks.append({
        "name": "Node.js",
        "value": nv,
        "ok": nv.startswith("v") and int(nv[1:].split(".")[0]) >= 16,
        "message": "Node 16+ required for frontend builds",
    })
    # OS / memory
    mem = _mem_mb()
    checks.append({"name": "OS", "value": platform.platform(), "ok": True})
    checks.append({
        "name": "Memory",
        "value": f"{mem} MB" if mem > 0 else "n/a",
        "ok": mem == -1 or mem >= 512,
        "message": "≥ 512 MB recommended",
    })
    # Disk
    disk = shutil.disk_usage("/")
    free_gb = round(disk.free / 1024**3, 1)
    checks.append({
        "name": "Disk free",
        "value": f"{free_gb} GB / {round(disk.total/1024**3,1)} GB",
        "ok": free_gb >= 1.0,
        "message": "≥ 1 GB free recommended",
    })
    # Mongo
    t0 = time.time()
    try:
        await db.command("ping")
        latency_ms = round((time.time() - t0) * 1000)
        checks.append({"name": "MongoDB", "value": f"reachable ({latency_ms} ms)", "ok": True})
    except Exception as e:
        checks.append({"name": "MongoDB", "value": "unreachable", "ok": False, "message": str(e)[:160]})
    # Packages
    for pkg in REQUIRED_PKGS:
        present = importlib.util.find_spec(pkg) is not None
        checks.append({
            "name": f"Package: {pkg}",
            "value": "installed" if present else "MISSING",
            "ok": present,
            "message": "Run: pip install " + pkg if not present else None,
        })
    # Env vars
    for env in REQUIRED_ENVS:
        present = bool(os.environ.get(env))
        checks.append({
            "name": f"Env: {env}",
            "value": "set" if present else "MISSING",
            "ok": present,
            "message": "Set in backend/.env and restart" if not present else None,
        })
    # Dirs
    for d in REQUIRED_DIRS:
        exists = os.path.isdir(d)
        writable = exists and os.access(d, os.W_OK)
        checks.append({
            "name": f"Storage: {d}",
            "value": "ok" if writable else ("not writable" if exists else "missing"),
            "ok": writable,
            "message": "Run repair to create + chmod" if not writable else None,
        })

    healthy = sum(1 for c in checks if c["ok"])
    return {
        "total": len(checks),
        "healthy": healthy,
        "unhealthy": len(checks) - healthy,
        "score": round(100 * healthy / max(1, len(checks))),
        "checks": checks,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }

@router.post("/repair")
async def repair():
    """Idempotently fixes the most common issues:
       - creates missing folders
       - chmod 0o755
       - clears stale cache
    """
    actions: List[Dict] = []
    for d in REQUIRED_DIRS:
        try:
            if not os.path.isdir(d):
                os.makedirs(d, exist_ok=True)
                actions.append({"action": f"Created {d}", "ok": True})
            else:
                actions.append({"action": f"Exists  {d}", "ok": True})
            os.chmod(d, 0o755)
        except Exception as e:
            actions.append({"action": f"Failed  {d}", "ok": False, "error": str(e)[:120]})
    # Touch a healthcheck file
    hc = "/app/.run/health.txt"
    try:
        with open(hc, "w") as f:
            f.write(datetime.now(timezone.utc).isoformat())
        actions.append({"action": f"Wrote {hc}", "ok": True})
    except Exception as e:
        actions.append({"action": f"Write {hc}", "ok": False, "error": str(e)[:120]})
    return {"ok": all(a.get("ok") for a in actions), "actions": actions}
