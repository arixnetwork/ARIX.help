import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  CheckCircle, Database, User, Globe, Sparkle, Lightning, EnvelopeSimple,
  CircleNotch, WarningCircle, ArrowRight, ArrowLeft, Cpu, HardDrives, Drop, ShieldCheck
} from "@phosphor-icons/react";
import { api } from "../lib/api";

const STEPS = [
  { id: "welcome",  label: "Welcome",  icon: Sparkle },
  { id: "system",   label: "System",   icon: HardDrives },
  { id: "site",     label: "Website",  icon: Globe },
  { id: "database", label: "Database", icon: Database },
  { id: "admin",    label: "Admin",    icon: User },
  { id: "ai",       label: "AI",       icon: Cpu },
  { id: "mail",     label: "Mail",     icon: EnvelopeSimple },
  { id: "install",  label: "Install",  icon: Lightning },
];

const AI_PROVIDERS = [
  { id: "anthropic", label: "Anthropic Claude" },
  { id: "openai",    label: "OpenAI" },
  { id: "gemini",    label: "Google Gemini" },
  { id: "emergent",  label: "Emergent Universal Key" },
  { id: "openrouter",label: "OpenRouter" },
  { id: "deepseek",  label: "DeepSeek" },
  { id: "grok",      label: "Grok (xAI)" },
];

export default function Install() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [system, setSystem] = useState(null);
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);
  const [dbTest, setDbTest] = useState(null);
  const [installResult, setInstallResult] = useState(null);

  const [form, setForm] = useState({
    site_name: "Arix.help",
    site_url: typeof window !== "undefined" ? window.location.origin : "",
    admin_name: "",
    admin_email: "",
    admin_password: "",
    db_host: "mongodb://localhost:27017",
    db_name: "arix_help",
    db_username: "",
    db_password: "",
    smtp_host: "",
    smtp_port: 587,
    smtp_user: "",
    smtp_password: "",
    smtp_from: "",
    preferred_ai: "anthropic",
    ai_key: "",
  });

  useEffect(() => {
    api.get("/install/status").then(({ data }) => {
      setSystem(data.system);
      setAlreadyInstalled(data.installed);
    }).catch(() => {});
  }, []);

  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target?.value ?? e }));

  const testDb = async () => {
    setBusy(true); setDbTest(null);
    try {
      const { data } = await api.post("/install/test-db", {
        host: form.db_host, db_name: form.db_name,
        username: form.db_username, password: form.db_password,
      });
      setDbTest({ ok: true, ...data });
      toast.success("Database reachable");
    } catch (e) {
      setDbTest({ ok: false, error: e.response?.data?.detail || "Connection failed" });
      toast.error("Connection failed");
    } finally { setBusy(false); }
  };

  const next = () => {
    // Validation per step
    const errs = validate(step, form);
    if (errs.length) { toast.error(errs[0]); return; }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const runInstall = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/install/run", form);
      setInstallResult(data);
      toast.success("Installation complete");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Installation failed");
    } finally { setBusy(false); }
  };

  const StepIcon = STEPS[step].icon;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 grid lg:grid-cols-[280px_1fr]">
      {/* Left rail */}
      <aside className="border-r border-white/5 p-8 hidden lg:flex flex-col gap-8 bg-[#080808]">
        <div className="flex items-center gap-2" data-testid="install-brand">
          <div className="w-7 h-7 bg-amber-500 grid place-items-center font-display text-black text-sm">A</div>
          <span className="font-display text-lg">Arix<span className="text-amber-500">.help</span></span>
        </div>
        <div>
          <div className="font-mono text-[10px] tracking-mono uppercase text-amber-400 mb-2">— Setup wizard</div>
          <h2 className="font-display text-2xl tracking-tighter mb-1">Install Arix</h2>
          <p className="text-zinc-500 text-sm">In just a few clicks, your self-hosted SaaS is online.</p>
        </div>
        <ol className="space-y-2 mt-2">
          {STEPS.map((s, i) => (
            <li key={s.id}
              className={`flex items-center gap-3 px-3 py-2 transition border-l-2 ${
                i < step ? "border-emerald-500 text-emerald-400" :
                i === step ? "border-amber-500 text-amber-400 bg-[#0f0f0f]" :
                "border-transparent text-zinc-500"
              }`}>
              <div className="font-mono text-[10px] tracking-mono w-6">{String(i+1).padStart(2,"0")}</div>
              <s.icon weight={i === step ? "fill" : "duotone"} size={16} />
              <span className="font-mono text-xs tracking-mono uppercase">{s.label}</span>
              {i < step && <CheckCircle weight="fill" size={12} className="ml-auto" />}
            </li>
          ))}
        </ol>
        <div className="mt-auto font-mono text-[10px] tracking-mono uppercase text-zinc-600">
          v1.0.0 · Self-hosted edition
        </div>
      </aside>

      {/* Main panel */}
      <main className="p-6 lg:p-12 flex flex-col" data-testid="install-panel">
        {alreadyInstalled && step < STEPS.length - 1 && (
          <div className="mb-6 border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3" data-testid="install-already-banner">
            <WarningCircle weight="fill" className="text-amber-400 mt-0.5" />
            <div>
              <div className="font-mono text-xs tracking-mono uppercase text-amber-400 mb-1">Already installed</div>
              <p className="text-sm text-zinc-300">Re-running the wizard will update settings but is safe and idempotent.{" "}
                <button onClick={() => navigate("/login")} className="underline text-amber-400" data-testid="install-skip-to-login">Skip to login →</button>
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-2">
          <StepIcon weight="duotone" className="text-amber-400" size={20} />
          <span className="font-mono text-xs tracking-mono uppercase text-amber-400">Step {step+1} / {STEPS.length}</span>
        </div>
        <h1 className="font-display text-4xl lg:text-5xl tracking-tighter mb-2" data-testid={`install-step-title-${STEPS[step].id}`}>
          {{
            welcome: "Let's get you set up.",
            system: "System health check",
            site: "Tell us about your site",
            database: "Connect your database",
            admin: "Create the admin account",
            ai: "Pick an AI provider",
            mail: "Mail settings (optional)",
            install: "Ready to install",
          }[STEPS[step].id]}
        </h1>
        <p className="text-zinc-400 mb-8 max-w-2xl">
          {{
            welcome: "This wizard configures the entire platform end-to-end. No documentation required.",
            system: "We've auto-detected your environment. Anything red below should be resolved before installing.",
            site: "Branding for the marketing and dashboard surfaces.",
            database: "MongoDB is the only datastore. We'll test your connection and create indexes automatically.",
            admin: "This account will be the first user with admin role. You can promote more admins later.",
            ai: "Power the AI Assistant with any provider. You can leave this empty and add it later.",
            mail: "Optional. Used for password resets, transactional emails, and alerts.",
            install: "Click install to provision the platform. The wizard is idempotent — re-running is safe.",
          }[STEPS[step].id]}
        </p>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div key={STEPS[step].id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              className="max-w-3xl">
              {STEPS[step].id === "welcome" && <Welcome system={system} />}
              {STEPS[step].id === "system" && <SystemCheck system={system} />}
              {STEPS[step].id === "site" && (
                <Grid2>
                  <Field label="Website name" value={form.site_name} onChange={upd("site_name")} testid="install-site-name" />
                  <Field label="Domain URL" value={form.site_url} onChange={upd("site_url")} testid="install-site-url" placeholder="https://app.example.com" />
                </Grid2>
              )}
              {STEPS[step].id === "database" && (
                <div className="space-y-5">
                  <Grid2>
                    <Field label="Database host" value={form.db_host} onChange={upd("db_host")} testid="install-db-host"
                      hint="MongoDB URI — e.g. mongodb://localhost:27017 or mongodb+srv://…" />
                    <Field label="Database name" value={form.db_name} onChange={upd("db_name")} testid="install-db-name" />
                    <Field label="Username (optional)" value={form.db_username} onChange={upd("db_username")} testid="install-db-user" />
                    <Field label="Password (optional)" type="password" value={form.db_password} onChange={upd("db_password")} testid="install-db-pass" />
                  </Grid2>
                  <button onClick={testDb} disabled={busy} data-testid="install-db-test"
                    className="bg-amber-500 text-black px-4 py-2.5 font-mono text-xs tracking-mono uppercase hover:bg-amber-400 transition flex items-center gap-2 disabled:opacity-50">
                    {busy ? <CircleNotch className="animate-spin" /> : <ShieldCheck weight="bold" />}
                    Test connection
                  </button>
                  {dbTest && (
                    <div className={`border p-4 ${dbTest.ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`} data-testid="install-db-result">
                      {dbTest.ok ? (
                        <>
                          <div className="font-mono text-xs tracking-mono uppercase text-emerald-400 mb-1">Connected</div>
                          <div className="text-sm text-zinc-300">MongoDB v{dbTest.mongo_version} · {dbTest.databases?.length || 0} other databases · target exists: {String(dbTest.target_db_exists)}</div>
                        </>
                      ) : (
                        <>
                          <div className="font-mono text-xs tracking-mono uppercase text-red-400 mb-1">Failed</div>
                          <div className="text-sm text-zinc-300">{dbTest.error}</div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
              {STEPS[step].id === "admin" && (
                <Grid2>
                  <Field label="Admin name" value={form.admin_name} onChange={upd("admin_name")} testid="install-admin-name" />
                  <Field label="Admin email" type="email" value={form.admin_email} onChange={upd("admin_email")} testid="install-admin-email" />
                  <Field label="Admin password (≥ 8 chars)" type="password" value={form.admin_password} onChange={upd("admin_password")} testid="install-admin-pass" />
                </Grid2>
              )}
              {STEPS[step].id === "ai" && (
                <div className="space-y-5">
                  <div>
                    <label className="font-mono text-[10px] tracking-mono uppercase text-zinc-500 block mb-2">Preferred provider</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" data-testid="install-ai-providers">
                      {AI_PROVIDERS.map(p => (
                        <button key={p.id} type="button" onClick={() => setForm(f => ({...f, preferred_ai: p.id}))}
                          data-testid={`install-ai-${p.id}`}
                          className={`text-left p-3 border transition font-mono text-[10px] tracking-mono uppercase ${
                            form.preferred_ai === p.id ? "border-amber-500 text-amber-400 bg-amber-500/10" : "border-white/10 text-zinc-400 hover:border-white/20"
                          }`}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Field label="API key (optional — add later from Integrations)" type="password" value={form.ai_key} onChange={upd("ai_key")} testid="install-ai-key" />
                </div>
              )}
              {STEPS[step].id === "mail" && (
                <Grid2>
                  <Field label="SMTP host" value={form.smtp_host} onChange={upd("smtp_host")} testid="install-smtp-host" placeholder="smtp.example.com" />
                  <Field label="SMTP port" type="number" value={form.smtp_port} onChange={(e)=>setForm(f=>({...f, smtp_port: Number(e.target.value)}))} testid="install-smtp-port" />
                  <Field label="SMTP user" value={form.smtp_user} onChange={upd("smtp_user")} testid="install-smtp-user" />
                  <Field label="SMTP password" type="password" value={form.smtp_password} onChange={upd("smtp_password")} testid="install-smtp-pass" />
                  <Field label="From email" value={form.smtp_from} onChange={upd("smtp_from")} testid="install-smtp-from" />
                </Grid2>
              )}
              {STEPS[step].id === "install" && (
                <div className="space-y-6">
                  {!installResult ? (
                    <>
                      <Summary form={form} />
                      <button onClick={runInstall} disabled={busy} data-testid="install-run-button"
                        className="bg-amber-500 text-black px-6 py-3 font-mono text-xs tracking-mono uppercase font-bold hover:bg-amber-400 transition disabled:opacity-50 flex items-center gap-3">
                        {busy ? <CircleNotch className="animate-spin" /> : <Lightning weight="fill" />}
                        {busy ? "Installing…" : "Install Arix.help"}
                      </button>
                    </>
                  ) : (
                    <div className="space-y-4" data-testid="install-result">
                      <div className="border border-emerald-500/30 bg-emerald-500/5 p-5">
                        <div className="flex items-center gap-3">
                          <CheckCircle weight="fill" className="text-emerald-400" size={24} />
                          <div>
                            <div className="font-display text-2xl tracking-tighter">Installation complete</div>
                            <p className="text-zinc-400 text-sm">{installResult.steps.length} steps executed. You can now log in.</p>
                          </div>
                        </div>
                      </div>
                      <div className="border border-white/10 divide-y divide-white/5">
                        {installResult.steps.map((s, i) => (
                          <div key={i} className="px-4 py-2.5 flex items-center justify-between" data-testid={`install-step-result-${i}`}>
                            <div className="flex items-center gap-3">
                              {s.ok ? <CheckCircle weight="fill" className="text-emerald-400" /> : <WarningCircle weight="fill" className="text-red-400" />}
                              <span className="text-sm">{s.step}</span>
                            </div>
                            <span className="font-mono text-[10px] tracking-mono uppercase text-zinc-500">{s.ok ? "OK" : "ERROR"}</span>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => navigate("/login")} data-testid="install-go-login"
                        className="bg-amber-500 text-black px-5 py-3 font-mono text-xs tracking-mono uppercase font-bold hover:bg-amber-400 transition flex items-center gap-2">
                        Go to login <ArrowRight weight="bold" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer nav */}
        <div className="mt-10 flex items-center justify-between max-w-3xl">
          <button onClick={prev} disabled={step === 0} data-testid="install-prev"
            className="font-mono text-xs tracking-mono uppercase text-zinc-400 hover:text-amber-400 transition disabled:opacity-30 flex items-center gap-2">
            <ArrowLeft weight="bold" /> Back
          </button>
          {step < STEPS.length - 1 && (
            <button onClick={next} data-testid="install-next"
              className="bg-amber-500 text-black px-5 py-2.5 font-mono text-xs tracking-mono uppercase font-bold hover:bg-amber-400 transition flex items-center gap-2">
              Continue <ArrowRight weight="bold" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

// --- Sub-components ------------------------------------------------------
function Field({ label, value, onChange, type = "text", testid, hint, placeholder }) {
  return (
    <div>
      <label className="font-mono text-[10px] tracking-mono uppercase text-zinc-500 block mb-1.5">{label}</label>
      <input type={type} value={value ?? ""} onChange={onChange} data-testid={testid} placeholder={placeholder}
        className="w-full bg-[#0a0a0a] border border-white/10 px-4 py-2.5 font-body focus:border-amber-500 focus:outline-none transition" />
      {hint && <div className="font-mono text-[10px] tracking-mono text-zinc-600 mt-1">{hint}</div>}
    </div>
  );
}

function Grid2({ children }) {
  return <div className="grid sm:grid-cols-2 gap-5">{children}</div>;
}

function Welcome({ system }) {
  return (
    <div className="space-y-4">
      <div className="border border-white/10 p-5 bg-[#0a0a0a]">
        <div className="font-mono text-[10px] tracking-mono uppercase text-amber-400 mb-2">What you'll configure</div>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm text-zinc-300">
          {["Site branding & domain","MongoDB connection","Admin account","AI provider key","SMTP (optional)","Storage permissions & cron"].map(x => (
            <li key={x} className="flex gap-2"><CheckCircle weight="fill" className="text-amber-500 mt-0.5 flex-shrink-0" size={14} /> {x}</li>
          ))}
        </ul>
      </div>
      {system && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5">
          <Tile label="Python" value={system.python_version} />
          <Tile label="Memory" value={system.memory_mb > 0 ? `${system.memory_mb} MB` : "n/a"} />
          <Tile label="Disk free" value={`${system.disk_free_gb} GB`} />
          <Tile label="Mongo" value={system.required_packages?.motor ? "ready" : "missing"} ok={system.required_packages?.motor} />
        </div>
      )}
    </div>
  );
}

function Tile({ label, value, ok = true }) {
  return (
    <div className="bg-[#0a0a0a] p-4">
      <div className="font-mono text-[10px] tracking-mono uppercase text-zinc-500">{label}</div>
      <div className={`font-display text-2xl tracking-tighter mt-1 ${ok ? "" : "text-red-400"}`}>{value}</div>
    </div>
  );
}

function SystemCheck({ system }) {
  if (!system) return <div className="font-mono text-xs tracking-mono uppercase text-zinc-500">DETECTING…</div>;
  const items = [
    { label: "Python runtime",   value: system.python_version, ok: true },
    { label: "Platform",         value: system.platform,        ok: true },
    { label: "Memory",           value: system.memory_mb > 0 ? `${system.memory_mb} MB` : "n/a", ok: system.memory_mb === -1 || system.memory_mb >= 512 },
    { label: "Disk free",        value: `${system.disk_free_gb} / ${system.disk_total_gb} GB`, ok: system.disk_free_gb >= 1 },
    { label: "Backend writable", value: system.sys_path_writable ? "yes" : "no", ok: system.sys_path_writable },
    ...Object.entries(system.required_packages || {}).map(([k, v]) => ({
      label: `Package: ${k}`, value: v ? "installed" : "MISSING", ok: v,
    })),
  ];
  return (
    <div className="border border-white/10 divide-y divide-white/5" data-testid="install-system-check">
      {items.map(i => (
        <div key={i.label} className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {i.ok ? <CheckCircle weight="fill" className="text-emerald-400" /> : <WarningCircle weight="fill" className="text-red-400" />}
            <span className="text-sm">{i.label}</span>
          </div>
          <span className="font-mono text-xs text-zinc-400">{i.value}</span>
        </div>
      ))}
    </div>
  );
}

function Summary({ form }) {
  const rows = [
    ["Website", form.site_name],
    ["Domain", form.site_url],
    ["Admin", `${form.admin_name} <${form.admin_email}>`],
    ["Database", `${form.db_host} / ${form.db_name}`],
    ["AI provider", form.preferred_ai + (form.ai_key ? " (key set)" : " (no key)")],
    ["SMTP", form.smtp_host ? `${form.smtp_host}:${form.smtp_port}` : "skipped"],
  ];
  return (
    <div className="border border-white/10 divide-y divide-white/5" data-testid="install-summary">
      {rows.map(([k, v]) => (
        <div key={k} className="px-4 py-3 flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-mono uppercase text-zinc-500">{k}</span>
          <span className="text-sm text-zinc-200 truncate max-w-[60%] text-right">{v}</span>
        </div>
      ))}
    </div>
  );
}

function validate(step, f) {
  const id = STEPS[step].id;
  const errs = [];
  if (id === "site") {
    if (!f.site_name.trim()) errs.push("Website name is required");
    if (!f.site_url.trim()) errs.push("Domain URL is required");
  }
  if (id === "database") {
    if (!f.db_host.trim()) errs.push("Database host is required");
    if (!f.db_name.trim()) errs.push("Database name is required");
  }
  if (id === "admin") {
    if (!f.admin_name.trim()) errs.push("Admin name is required");
    if (!/^\S+@\S+\.\S+$/.test(f.admin_email)) errs.push("Valid admin email required");
    if (f.admin_password.length < 8) errs.push("Password must be ≥ 8 characters");
  }
  return errs;
}
