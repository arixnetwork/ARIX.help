import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lightning, Code, GitBranch, Cpu, ShieldCheck, RocketLaunch, ArrowRight, Star, CheckCircle } from "@phosphor-icons/react";

const features = [
  { icon: Lightning, title: "Live preview", desc: "Hot-reload your project in milliseconds. Edit, see, ship.", span: "lg:col-span-2" },
  { icon: Code, title: "Monaco editor", desc: "The same editor that powers VSCode — right in your browser." },
  { icon: Cpu, title: "Multi-model AI", desc: "Claude Sonnet 4.5, GPT-5.2 & Gemini 3 Pro — switch on demand." },
  { icon: GitBranch, title: "GitHub import", desc: "Bring any repo. Templates for every modern stack." },
  { icon: ShieldCheck, title: "Sandbox runtime", desc: "Isolated containers with CPU & memory caps.", span: "lg:col-span-2" },
  { icon: RocketLaunch, title: "One-click deploy", desc: "Push to Vercel, Netlify, AWS — or your own VPS." },
];

const tiers = [
  { name: "Free", price: "$0", period: "forever", desc: "For curious builders.", features: ["50 AI requests / day", "3 active projects", "Live previews", "Community templates"], cta: "Start free" },
  { name: "Pro", price: "$24", period: "/ month", desc: "For shipping serious work.", features: ["Unlimited AI requests", "Unlimited projects", "Priority runtimes", "GitHub & GitLab import", "1-click deploys"], cta: "Go Pro", highlight: true },
  { name: "Enterprise", price: "Talk", period: "to us", desc: "For teams that need scale.", features: ["SOC2-ready isolation", "Dedicated runtimes", "SSO + RBAC", "Audit logs & SLAs", "Custom AI quotas"], cta: "Contact sales" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-amber-500 selection:text-black">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="brand-home-link">
            <div className="w-7 h-7 bg-amber-500 grid place-items-center font-display text-black text-sm">A</div>
            <span className="font-display text-lg tracking-tight">Arix<span className="text-amber-500">.help</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 font-mono text-xs tracking-mono uppercase text-zinc-400">
            <a href="#features" className="hover:text-amber-400 transition" data-testid="nav-features">Features</a>
            <a href="#pricing" className="hover:text-amber-400 transition" data-testid="nav-pricing">Pricing</a>
            <a href="#stack" className="hover:text-amber-400 transition" data-testid="nav-stack">Stack</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="font-mono text-xs tracking-mono uppercase text-zinc-300 hover:text-amber-400 transition" data-testid="header-login-link">Log in</Link>
            <Link to="/signup" className="font-mono text-xs tracking-mono uppercase bg-amber-500 text-black px-4 py-2 rounded-sm hover:bg-amber-400 transition" data-testid="header-signup-link">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid bg-grid-fade opacity-50" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url('https://static.prod-images.emergentagent.com/jobs/2e4fd4de-b8b6-4b24-a536-a12da483f578/images/16402d4ec0768f7a41a39baba4c561353ec24dd67c0bad843716e1ba8b6bac7f.png')",
            backgroundSize: "cover", backgroundPosition: "center", mixBlendMode: "screen",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 pt-24 pb-32">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="font-mono text-xs tracking-mono uppercase text-amber-400 mb-6">
            ▲ The AI Operating System for Developers
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl tracking-tighter leading-[0.95] max-w-4xl">
            Code. Preview. <br />
            <span className="text-amber-500">Deploy</span> with AI.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-8 text-base lg:text-lg text-zinc-400 max-w-2xl">
            Arix.help is an AI-powered developer workspace. Upload any project, edit visually, fix bugs with AI,
            preview live, and ship — without leaving the browser.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-10 flex flex-wrap items-center gap-4">
            <Link to="/signup" data-testid="hero-cta-signup"
              className="group inline-flex items-center gap-3 bg-amber-500 text-black px-6 py-3 rounded-sm font-mono text-xs tracking-mono uppercase font-bold hover:bg-amber-400 transition">
              Start building free
              <ArrowRight weight="bold" className="group-hover:translate-x-1 transition" />
            </Link>
            <Link to="/login" data-testid="hero-cta-login"
              className="inline-flex items-center gap-3 border border-white/15 px-6 py-3 rounded-sm font-mono text-xs tracking-mono uppercase hover:border-amber-500 hover:text-amber-400 transition">
              View demo
            </Link>
          </motion.div>

          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 font-mono text-xs tracking-mono uppercase text-zinc-500">
            <span className="flex items-center gap-2"><CheckCircle weight="fill" className="text-amber-500" /> No credit card</span>
            <span className="flex items-center gap-2"><CheckCircle weight="fill" className="text-amber-500" /> 50 free AI requests / day</span>
            <span className="flex items-center gap-2"><CheckCircle weight="fill" className="text-amber-500" /> All major frameworks</span>
          </div>

          {/* Workspace preview screenshot mock */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3 }}
            className="mt-20 border border-white/10 bg-[#0a0a0a] overflow-hidden">
            <div className="h-10 border-b border-white/10 flex items-center px-4 gap-2 bg-[#121212]">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              <div className="ml-6 font-mono text-[10px] tracking-mono uppercase text-zinc-500">arix.help / workspace / hello-world</div>
            </div>
            <div className="grid grid-cols-12 h-[420px]">
              <div className="col-span-2 border-r border-white/10 p-3 font-mono text-xs space-y-1.5 bg-[#0d0d0d]">
                <div className="text-zinc-500 uppercase tracking-mono text-[10px]">Explorer</div>
                <div className="text-zinc-300">▸ src</div>
                <div className="text-amber-400 pl-3">● App.jsx</div>
                <div className="text-zinc-400 pl-3">main.jsx</div>
                <div className="text-zinc-400 pl-3">styles.css</div>
                <div className="text-zinc-300">package.json</div>
                <div className="text-zinc-300">README.md</div>
              </div>
              <div className="col-span-6 border-r border-white/10 p-4 font-mono text-xs bg-[#050505] overflow-hidden">
                <div className="text-zinc-600">1  <span className="text-pink-400">export default</span> <span className="text-amber-400">function</span> App() {`{`}</div>
                <div className="text-zinc-600">2    <span className="text-pink-400">return</span> (</div>
                <div className="text-zinc-600">3      &lt;<span className="text-emerald-400">main</span>&gt;</div>
                <div className="text-zinc-600">4        &lt;<span className="text-emerald-400">h1</span>&gt;Hello <span className="text-amber-300">Arix.help</span>&lt;/<span className="text-emerald-400">h1</span>&gt;</div>
                <div className="text-zinc-600">5      &lt;/<span className="text-emerald-400">main</span>&gt;</div>
                <div className="text-zinc-600">6    );</div>
                <div className="text-zinc-600">7  {`}`}</div>
              </div>
              <div className="col-span-4 p-4 bg-[#0a0a0a] flex flex-col gap-3 text-xs">
                <div className="font-mono uppercase tracking-mono text-[10px] text-zinc-500">AI Assistant — Claude Sonnet 4.5</div>
                <div className="border border-white/10 p-3 text-zinc-300 leading-relaxed">
                  Fix the button color and add hover state on the CTA.
                </div>
                <div className="border-l-2 border-amber-500 pl-3 text-zinc-400 leading-relaxed">
                  Updated <span className="text-amber-300">styles.css</span> — added <code className="bg-[#121212] px-1">:hover</code> with amber-400 background and ease-in transition. Preview reloaded.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-white/5 py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-end justify-between flex-wrap gap-6 mb-16">
            <div>
              <div className="font-mono text-xs tracking-mono uppercase text-amber-400 mb-3">— Features</div>
              <h2 className="font-display text-4xl lg:text-5xl tracking-tighter max-w-xl">Everything you need to ship.</h2>
            </div>
            <p className="text-zinc-400 max-w-md">From first commit to global deploy — an AI that reads your code, fixes your bugs, and writes your tests.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-white/[0.05]">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className={`bg-[#050505] p-8 lg:p-10 tracing-border hover:bg-[#0a0a0a] transition ${f.span || ""}`}>
                <f.icon weight="duotone" className="text-amber-500" size={32} />
                <h3 className="font-display text-xl mt-6">{f.title}</h3>
                <p className="text-zinc-400 mt-2 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stack */}
      <section id="stack" className="border-t border-white/5 py-32 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="font-mono text-xs tracking-mono uppercase text-amber-400 mb-3">— Supported stacks</div>
          <h2 className="font-display text-4xl lg:text-5xl tracking-tighter max-w-2xl mb-12">Every framework. One workspace.</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-px bg-white/5">
            {["HTML/CSS/JS","React","Next.js","Vue","Nuxt","Svelte","Angular","Node.js","Express","NestJS","Python","Django","Flask","FastAPI","PHP","Laravel","WordPress","Shopify","Docker","Kubernetes","React Native","Flutter","GitHub","GitLab"].map((s) => (
              <div key={s} className="bg-[#080808] px-5 py-5 font-mono text-xs tracking-mono uppercase text-zinc-400 hover:text-amber-400 hover:bg-[#0c0c0c] transition" data-testid={`stack-${s.toLowerCase().replace(/[^a-z]/g,'-')}`}>{s}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-white/5 py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="font-mono text-xs tracking-mono uppercase text-amber-400 mb-3">— Pricing</div>
          <h2 className="font-display text-4xl lg:text-5xl tracking-tighter mb-16">Simple. Honest. Pay for what you use.</h2>
          <div className="grid lg:grid-cols-3 gap-6">
            {tiers.map((t) => (
              <div key={t.name}
                className={`border ${t.highlight ? "border-amber-500" : "border-white/10"} bg-[#0a0a0a] p-8 flex flex-col`}>
                <div className="flex items-center gap-2">
                  <div className="font-mono text-xs tracking-mono uppercase text-zinc-400">{t.name}</div>
                  {t.highlight && <span className="font-mono text-[10px] tracking-mono uppercase bg-amber-500 text-black px-2 py-0.5">Popular</span>}
                </div>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-5xl tracking-tighter">{t.price}</span>
                  <span className="text-zinc-500 text-sm">{t.period}</span>
                </div>
                <p className="mt-3 text-zinc-400">{t.desc}</p>
                <ul className="mt-6 space-y-2.5">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-3 text-sm text-zinc-300">
                      <CheckCircle weight="fill" className="text-amber-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" data-testid={`pricing-cta-${t.name.toLowerCase()}`}
                  className={`mt-8 text-center font-mono text-xs tracking-mono uppercase py-3 rounded-sm transition ${t.highlight ? "bg-amber-500 text-black hover:bg-amber-400" : "border border-white/15 hover:border-amber-500 hover:text-amber-400"}`}>
                  {t.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-white/5 py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <div className="flex justify-center gap-1 mb-6">
            {[1,2,3,4,5].map(i => <Star key={i} weight="fill" className="text-amber-500" />)}
          </div>
          <h2 className="font-display text-4xl lg:text-6xl tracking-tighter">The AI workspace developers wished for.</h2>
          <p className="mt-6 text-zinc-400 text-lg">Start building in 60 seconds. No setup, no Docker, no DevOps.</p>
          <Link to="/signup" data-testid="footer-cta-signup"
            className="mt-8 inline-flex items-center gap-3 bg-amber-500 text-black px-8 py-4 rounded-sm font-mono text-xs tracking-mono uppercase font-bold hover:bg-amber-400 transition">
            Get started for free <ArrowRight weight="bold" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5 py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-wrap justify-between gap-4 font-mono text-xs tracking-mono uppercase text-zinc-500">
          <div>© 2026 Arix.help — Built with AI, for builders.</div>
          <div className="flex gap-6">
            <span>Privacy</span><span>Terms</span><span>Status</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
