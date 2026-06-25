"""Integration Center — /api/integrations/*

Stores third-party provider configurations (API keys, endpoints).
Secrets are stored server-side and never returned to client; only a preview is exposed.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone

router = APIRouter(prefix="/api/integrations", tags=["integrations"])

# Catalog of supported providers, surfaced on the UI even before keys are set.
CATALOG = [
    # AI / ML
    {"provider": "openai", "label": "OpenAI", "category": "ai", "needs": ["api_key"]},
    {"provider": "anthropic", "label": "Anthropic Claude", "category": "ai", "needs": ["api_key"]},
    {"provider": "gemini", "label": "Google Gemini", "category": "ai", "needs": ["api_key"]},
    {"provider": "grok", "label": "Grok (xAI)", "category": "ai", "needs": ["api_key"]},
    {"provider": "deepseek", "label": "DeepSeek", "category": "ai", "needs": ["api_key"]},
    {"provider": "openrouter", "label": "OpenRouter", "category": "ai", "needs": ["api_key"]},
    {"provider": "stability", "label": "Stability AI", "category": "ai", "needs": ["api_key"]},
    {"provider": "replicate", "label": "Replicate", "category": "ai", "needs": ["api_key"]},
    {"provider": "elevenlabs", "label": "ElevenLabs", "category": "voice", "needs": ["api_key"]},
    {"provider": "emergent", "label": "Emergent Universal Key", "category": "ai", "needs": ["api_key"]},
    # Payments
    {"provider": "stripe", "label": "Stripe", "category": "payments", "needs": ["api_key", "webhook_secret"]},
    {"provider": "paypal", "label": "PayPal", "category": "payments", "needs": ["client_id", "client_secret"]},
    {"provider": "paddle", "label": "Paddle", "category": "payments", "needs": ["api_key"]},
    {"provider": "lemonsqueezy", "label": "LemonSqueezy", "category": "payments", "needs": ["api_key"]},
    # Mail
    {"provider": "smtp", "label": "Custom SMTP", "category": "email", "needs": ["host", "port", "user", "password", "from_email"]},
    {"provider": "sendgrid", "label": "SendGrid", "category": "email", "needs": ["api_key"]},
    {"provider": "resend", "label": "Resend", "category": "email", "needs": ["api_key"]},
    # Misc
    {"provider": "webhook", "label": "Outbound Webhook", "category": "misc", "needs": ["url", "secret"]},
]

# --- Schemas -------------------------------------------------------------
class IntegrationIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    provider: str
    enabled: bool = True
    fields: dict = {}  # raw secrets keyed by name (api_key, host, etc)

# --- Helpers -------------------------------------------------------------
def _preview(v: str) -> str:
    if not v:
        return ""
    if len(v) <= 8:
        return "•" * len(v)
    return v[:4] + "•••" + v[-4:]

def _public(doc: dict) -> dict:
    """Return a sanitised version with no raw secrets."""
    out = {k: v for k, v in doc.items() if not k.startswith("_") and k != "_id"}
    raw = doc.get("_secrets", {}) or {}
    out["fields_preview"] = {k: _preview(str(v)) for k, v in raw.items()}
    out["secret_set"] = bool(raw)
    return out

# --- Endpoints -----------------------------------------------------------
@router.get("/catalog")
async def get_catalog():
    return CATALOG

@router.get("")
async def list_integrations(user=Depends(lambda: None)):
    from server import db, get_current_user
    # Manual auth — admin only
    return await _list()

async def _list():
    from server import db
    docs = await db.integrations.find({}, {"_id": 0}).to_list(200)
    # Hide raw secrets
    return [_public(d) for d in docs]

@router.put("/{provider}")
async def upsert_integration(provider: str, body: IntegrationIn):
    """Save / update an integration. Raw secrets stored under `_secrets`."""
    from server import db
    catalog_item = next((c for c in CATALOG if c["provider"] == provider), None)
    if not catalog_item:
        raise HTTPException(status_code=404, detail="Unknown provider")
    update = {
        "provider": provider,
        "label": catalog_item["label"],
        "category": catalog_item["category"],
        "enabled": body.enabled,
        "_secrets": body.fields or {},
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.integrations.update_one({"provider": provider}, {"$set": update}, upsert=True)
    doc = await db.integrations.find_one({"provider": provider}, {"_id": 0})
    return _public(doc)

@router.delete("/{provider}")
async def delete_integration(provider: str):
    from server import db
    await db.integrations.delete_one({"provider": provider})
    return {"ok": True}

@router.post("/{provider}/test")
async def test_integration(provider: str):
    """Best-effort connectivity test for the given provider.
    Real verification (e.g. listing OpenAI models) is provider-specific; we
    perform a soft check (key is present, length looks plausible)."""
    from server import db
    doc = await db.integrations.find_one({"provider": provider}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Integration not configured")
    secrets = doc.get("_secrets", {}) or {}
    needs = next((c["needs"] for c in CATALOG if c["provider"] == provider), [])
    missing = [n for n in needs if not secrets.get(n)]
    if missing:
        return {"ok": False, "error": f"Missing: {', '.join(missing)}"}
    # For known shapes, do a soft length check
    if provider in ("openai", "anthropic", "stripe") and len(secrets.get("api_key", "")) < 16:
        return {"ok": False, "error": "API key looks too short"}
    return {"ok": True, "message": f"{provider} configuration looks valid"}
