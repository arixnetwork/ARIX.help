import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { GoogleLogo, ArrowRight } from "@phosphor-icons/react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const googleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-[#050505] grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 border-r border-white/5 bg-grid bg-grid-fade relative overflow-hidden">
        <Link to="/" className="flex items-center gap-2 relative z-10" data-testid="login-brand-link">
          <div className="w-7 h-7 bg-amber-500 grid place-items-center font-display text-black text-sm">A</div>
          <span className="font-display text-lg">Arix<span className="text-amber-500">.help</span></span>
        </Link>
        <div className="relative z-10 max-w-md">
          <div className="font-mono text-xs tracking-mono uppercase text-amber-400 mb-4">— Build with AI</div>
          <h2 className="font-display text-4xl tracking-tighter leading-tight">
            "Arix replaced 3 tools in our stack. Our team ships 2x faster."
          </h2>
          <div className="mt-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500 grid place-items-center font-display text-black text-sm">L</div>
            <div className="text-sm">
              <div className="font-medium">Liam Carter</div>
              <div className="text-zinc-500 font-mono text-xs tracking-mono">CTO · Northwind Labs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="font-mono text-xs tracking-mono uppercase text-amber-400 mb-3">— Welcome back</div>
          <h1 className="font-display text-4xl tracking-tighter mb-2">Sign in to Arix</h1>
          <p className="text-zinc-400 mb-8">Continue building from where you left off.</p>

          <button onClick={googleLogin} data-testid="login-google-button"
            className="w-full flex items-center justify-center gap-3 border border-white/15 px-4 py-3 rounded-sm hover:border-amber-500 hover:bg-[#0a0a0a] transition font-mono text-xs tracking-mono uppercase">
            <GoogleLogo weight="bold" /> Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="font-mono text-[10px] tracking-mono uppercase text-zinc-500">or with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="font-mono text-[10px] tracking-mono uppercase text-zinc-500 block mb-1.5">Email</label>
              <input data-testid="login-email-input" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 px-4 py-3 rounded-sm font-body focus:border-amber-500 focus:outline-none transition" />
            </div>
            <div>
              <label className="font-mono text-[10px] tracking-mono uppercase text-zinc-500 block mb-1.5">Password</label>
              <input data-testid="login-password-input" type="password" required value={password} onChange={(e)=>setPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 px-4 py-3 rounded-sm font-body focus:border-amber-500 focus:outline-none transition" />
            </div>
            <button type="submit" disabled={busy} data-testid="login-submit-button"
              className="w-full bg-amber-500 text-black px-4 py-3 rounded-sm font-mono text-xs tracking-mono uppercase font-bold hover:bg-amber-400 transition disabled:opacity-60 flex items-center justify-center gap-3">
              {busy ? "Signing in…" : <>Sign in <ArrowRight weight="bold" /></>}
            </button>
          </form>

          <div className="mt-6 text-sm text-zinc-500 text-center">
            New to Arix? <Link to="/signup" className="text-amber-400 hover:underline" data-testid="login-to-signup-link">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
