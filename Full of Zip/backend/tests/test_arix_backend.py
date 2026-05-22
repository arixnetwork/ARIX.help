"""Arix.help backend pytest suite covering auth, projects, files, chats, templates, deployments, admin."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://arix-builder.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

UNIQ = uuid.uuid4().hex[:8]
TEST_EMAIL = f"test_{UNIQ}@arix.help"
TEST_PASS = "Arix2026!"
TEST_NAME = "Test Dev"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def token(session):
    r = session.post(f"{API}/auth/register", json={"email": TEST_EMAIL, "password": TEST_PASS, "name": TEST_NAME}, timeout=15)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and "user" in data
    assert data["user"]["email"] == TEST_EMAIL
    return data["token"]


@pytest.fixture(scope="session")
def auth(session, token):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {token}"})
    return s


# --- Auth ----------------------------------------------------------------
class TestAuth:
    def test_root(self, session):
        r = session.get(f"{API}/", timeout=10)
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_duplicate_register(self, session, token):
        r = session.post(f"{API}/auth/register", json={"email": TEST_EMAIL, "password": TEST_PASS, "name": TEST_NAME})
        assert r.status_code == 400

    def test_login(self, session, token):
        r = session.post(f"{API}/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASS})
        assert r.status_code == 200
        body = r.json()
        assert body["user"]["email"] == TEST_EMAIL
        assert isinstance(body["token"], str) and len(body["token"]) > 10

    def test_login_invalid(self, session):
        r = session.post(f"{API}/auth/login", json={"email": TEST_EMAIL, "password": "wrong!"})
        assert r.status_code == 401

    def test_me_with_jwt(self, auth):
        r = auth.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == TEST_EMAIL

    def test_me_unauthorized(self, session):
        r = session.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_logout(self, auth):
        r = auth.post(f"{API}/auth/logout")
        assert r.status_code == 200

    def test_google_session_invalid(self, session):
        r = session.post(f"{API}/auth/google/session", json={"session_id": "invalid-session-xyz"})
        # Must NOT crash; expect 401 (invalid session)
        assert r.status_code in (401, 400), f"got {r.status_code}: {r.text[:200]}"


# --- Projects + Files ----------------------------------------------------
class TestProjects:
    project_id = None

    def test_create_project(self, auth):
        r = auth.post(f"{API}/projects", json={"name": f"TEST_proj_{UNIQ}", "framework": "static", "description": "test"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"].startswith("TEST_proj_")
        assert data["framework"] == "static"
        TestProjects.project_id = data["project_id"]

    def test_list_projects(self, auth):
        r = auth.get(f"{API}/projects")
        assert r.status_code == 200
        ids = [p["project_id"] for p in r.json()]
        assert TestProjects.project_id in ids

    def test_get_project(self, auth):
        r = auth.get(f"{API}/projects/{TestProjects.project_id}")
        assert r.status_code == 200
        assert r.json()["project_id"] == TestProjects.project_id

    def test_starter_files_seeded(self, auth):
        r = auth.get(f"{API}/projects/{TestProjects.project_id}/files")
        assert r.status_code == 200
        files = r.json()
        paths = {f["path"] for f in files}
        # static framework seeds these
        assert {"index.html", "styles.css", "app.js"}.issubset(paths), f"got: {paths}"

    def test_upsert_file_create_then_update(self, auth):
        # create new
        r = auth.post(
            f"{API}/projects/{TestProjects.project_id}/files",
            json={"path": "new.txt", "content": "v1"},
        )
        assert r.status_code == 200
        assert r.json()["content"] == "v1"
        # update existing
        r2 = auth.post(
            f"{API}/projects/{TestProjects.project_id}/files",
            json={"path": "new.txt", "content": "v2"},
        )
        assert r2.status_code == 200
        assert r2.json()["content"] == "v2"
        # verify GET
        r3 = auth.get(f"{API}/projects/{TestProjects.project_id}/files")
        nf = [f for f in r3.json() if f["path"] == "new.txt"][0]
        assert nf["content"] == "v2"

    def test_delete_file(self, auth):
        r = auth.delete(f"{API}/projects/{TestProjects.project_id}/files", params={"path": "new.txt"})
        assert r.status_code == 200
        assert r.json()["deleted"] == 1

    def test_projects_require_auth(self, session):
        assert session.get(f"{API}/projects").status_code == 401

    def test_delete_project(self, auth):
        r = auth.delete(f"{API}/projects/{TestProjects.project_id}")
        assert r.status_code == 200
        # 404 after
        r2 = auth.get(f"{API}/projects/{TestProjects.project_id}")
        assert r2.status_code == 404


# --- Chats + AI ----------------------------------------------------------
class TestChats:
    chat_id = None

    def test_create_chat(self, auth):
        r = auth.post(f"{API}/chats", json={"title": "New Chat"})
        assert r.status_code == 200
        data = r.json()
        TestChats.chat_id = data["chat_id"]
        assert data["title"] == "New Chat"

    def test_list_chats(self, auth):
        r = auth.get(f"{API}/chats")
        assert r.status_code == 200
        ids = [c["chat_id"] for c in r.json()]
        assert TestChats.chat_id in ids

    def test_send_message_llm(self, auth):
        # Real LLM call via Emergent key; allow generous timeout
        r = auth.post(
            f"{API}/chats/{TestChats.chat_id}/messages",
            json={"content": "Reply with the single word: PONG", "model": "claude-sonnet-4-5-20250929", "provider": "anthropic"},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user_message"]["role"] == "user"
        assert data["assistant_message"]["role"] == "assistant"
        assert len(data["assistant_message"]["content"]) > 0

    def test_get_messages(self, auth):
        r = auth.get(f"{API}/chats/{TestChats.chat_id}/messages")
        assert r.status_code == 200
        msgs = r.json()
        # must contain at least one user + one assistant
        roles = [m["role"] for m in msgs]
        assert "user" in roles and "assistant" in roles


# --- Templates -----------------------------------------------------------
class TestTemplates:
    def test_templates_list(self, session):
        r = session.get(f"{API}/templates")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 14, f"expected 14, got {len(data)}"


# --- Deployments ---------------------------------------------------------
class TestDeployments:
    def test_list_deployments(self, auth):
        r = auth.get(f"{API}/deployments")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_deployment(self, auth):
        # need a project
        proj = auth.post(f"{API}/projects", json={"name": f"TEST_dep_{UNIQ}", "framework": "static"}).json()
        r = auth.post(f"{API}/deployments", json={"project_id": proj["project_id"], "target": "vercel"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "ready"
        assert "url" in data and data["url"].startswith("https://")
        assert isinstance(data["logs"], list) and len(data["logs"]) >= 5
        # cleanup
        auth.delete(f"{API}/projects/{proj['project_id']}")


# --- Admin ---------------------------------------------------------------
class TestAdmin:
    def test_admin_stats_forbidden_for_free(self, auth):
        r = auth.get(f"{API}/admin/stats")
        assert r.status_code == 403

    def test_admin_stats_requires_auth(self, session):
        r = session.get(f"{API}/admin/stats")
        assert r.status_code == 401
