import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const match = hash.match(/session_id=([^&]+)/);
    if (!match) {
      navigate("/login");
      return;
    }
    const session_id = match[1];
    (async () => {
      try {
        const { data } = await api.post("/auth/google/session", { session_id });
        if (data.token) localStorage.setItem("arix_token", data.token);
        setUser(data.user);
        window.history.replaceState(null, "", "/dashboard");
        navigate("/dashboard", { replace: true, state: { user: data.user } });
      } catch (e) {
        navigate("/login?error=oauth_failed");
      }
    })();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]" data-testid="auth-callback">
      <div className="text-center">
        <div className="font-display text-2xl mb-3">Signing you in</div>
        <div className="font-mono text-xs tracking-mono text-zinc-500">EXCHANGING SESSION…</div>
      </div>
    </div>
  );
}
