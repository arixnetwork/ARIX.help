import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { GoogleLogo, ArrowRight } from "@phosphor-icons/react";

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register(email, password, name);
      toast.success("Welcome to Arix.help");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Sign up failed");
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
      <div className="hidden lg:flex flex-col justify-between p-12 border-r border-white/5 bg-grid bg-grid-fade relative overflow-hidden">
        <Link to="/" className="flex items-center gap-2 relative z-10" data-testid="signup-brand-link">
          <div className="w-7 h-7 bg-amber-500 grid place-items-center font-display text-black text-sm">A</div>
          <span className="font-display text-lg">Arix<span className="text-amber-500">.help</span></span>
        </Link>
        <div className="relative z-10 max-w-md">
          <div className="font-mono text-xs tracking-mono uppercase text-amber-400 mb-4">— What you'll get</div>
          <h2 className="font-display text-4xl tracking-tighter leading-tight">
            Ship faster with AI in your editor, terminal, and preview.
          </h2>
          <ul className="mt-8 space-y-3 font-mono text-xs tracking-mono uppercase text-zinc-300">
            <li>▸ Multi-model AI: Claude · GPT · Gemini</li>
            <li>▸ Monaco editor + live preview</li>
            <li>▸ One-click deploys</li>
            <li>▸ Free forever tier</li>
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="font-mono text-xs tracking-mono uppercase text-amber-400 mb-3">— Create account</div>
          <h1 className="font-display text-4xl tracking-tighter mb-2">Start with Arix</h1>
          <p className="text-zinc-400 mb-8">Free forever for solo devs. No credit card required.</p>

          <button onClick={googleLogin} data-testid="signup-google-button"
            className="w-full flex items-center justify-center gap-3 border border-white/15 px-4 py-3 rounded-sm hover:border-amber-500 hover:bg-[#0a0a0a] transition font-mono text-xs tracking-mono uppercase">
            <GoogleLogo weight="bold" /> Sign up with Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="font-mono text-[10px] tracking-mono uppercase text-zinc-500">or with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="font-mono text-[10px] tracking-mono uppercase text-zinc-500 block mb-1.5">Full name</label>
              <input data-testid="signup-name-input" type="text" required value={name} onChange={(e)=>setName(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 px-4 py-3 rounded-sm font-body focus:border-amber-500 focus:outline-none transition" />
            </div>
            <div>
              <label className="font-mono text-[10px] tracking-mono uppercase text-zinc-500 block mb-1.5">Email</label>
              <input data-testid="signup-email-input" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 px-4 py-3 rounded-sm font-body focus:border-amber-500 focus:outline-none transition" />
            </div>
            <div>
              <label className="font-mono text-[10px] tracking-mono uppercase text-zinc-500 block mb-1.5">Password</label>
              <input data-testid="signup-password-input" type="password" required minLength={6} value={password} onChange={(e)=>setPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 px-4 py-3 rounded-sm font-body focus:border-amber-500 focus:outline-none transition" />
            </div>
            <button type="submit" disabled={busy} data-testid="signup-submit-button"
              className="w-full bg-amber-500 text-black px-4 py-3 rounded-sm font-mono text-xs tracking-mono uppercase font-bold hover:bg-amber-400 transition disabled:opacity-60 flex items-center justify-center gap-3">
              {busy ? "Creating account…" : <>Create account <ArrowRight weight="bold" /></>}
            </button>
          </form>

          <div className="mt-6 text-sm text-zinc-500 text-center">
            Already have an account? <Link to="/login" className="text-amber-400 hover:underline" data-testid="signup-to-login-link">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
