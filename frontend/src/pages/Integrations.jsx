import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plug, CheckCircle, X, ShieldCheck, Trash, CircleNotch } from "@phosphor-icons/react";
import { api } from "../lib/api";

const FIELD_LABELS = {
  api_key: "API Key",
  client_id: "Client ID",
  client_secret: "Client Secret",
  webhook_secret: "Webhook Secret",
  host: "SMTP host",
  port: "SMTP port",
  user: "SMTP user",
  password: "SMTP password",
  from_email: "From email",
  url: "Webhook URL",
  secret: "Webhook secret",
};

export default function Integrations() {
  const [catalog, setCatalog] = useState([]);
  const [configured, setConfigured] = useState([]);
  const [active, setActive] = useState(null);
  const [fields, setFields] = useState({});
  const [enabled, setEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("All");

  const load = async () => {
    const [{data: cat}, {data: conf}] = await Promise.all([
      api.get("/integrations/catalog"),
      api.get("/integrations"),
    ]);
    setCatalog(cat); setConfigured(conf);
  };
  useEffect(() => { load(); }, []);

  const byProvider = Object.fromEntries(configured.map(c => [c.provider, c]));
  const cats = ["All", ...Array.from(new Set(catalog.map(i => i.category)))];
  const visible = filter === "All" ? catalog : catalog.filter(i => i.category === filter);

  const open = (p) => {
    setActive(p);
    setEnabled(byProvider[p.provider]?.enabled ?? true);
    setFields({});  // never pre-fill secrets
  };
  const close = () => { setActive(null); setFields({}); };

  const save = async () => {
    if (!active) return;
    setBusy(true);
    try {
      await api.put(`/integrations/${active.provider}`, { provider: active.provider, enabled, fields });
      toast.success(`${active.label} saved`);
      close(); load();
    } catch { toast.error("Save failed"); }
    finally { setBusy(false); }
  };

  const test = async (provider) => {
    setBusy(true);
    try {
      const { data } = await api.post(`/integrations/${provider}/test`);
      data.ok ? toast.success(data.message || "OK") : toast.error(data.error);
    } catch (e) { toast.error(e.response?.data?.detail || "Test failed"); }
    finally { setBusy(false); }
  };

  const remove = async (provider) => {
    if (!confirm(`Remove ${provider} integration?`)) return;
    await api.delete(`/integrations/${provider}`);
    toast.success("Removed"); load();
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-white/5 bg-[#080808] px-8 py-6">
        <div className="font-mono text-xs tracking-mono uppercase text-amber-400 mb-1">— Integration Center</div>
        <h1 className="font-display text-3xl tracking-tighter">Connect your stack</h1>
        <p className="text-zinc-400 mt-2 text-sm max-w-xl">Plug in AI providers, payment processors, mail services, and webhooks. Keys are stored server-side and never exposed to the client.</p>
      </div>
      <div className="px-8 py-4 flex gap-2 border-b border-white/5 overflow-x-auto" data-testid="integration-filters">
        {cats.map(c => (
          <button key={c} onClick={() => setFilter(c)} data-testid={`int-filter-${c.toLowerCase()}`}
            className={`px-3 py-1.5 font-mono text-[10px] tracking-mono uppercase border transition ${filter === c ? "border-amber-500 text-amber-400 bg-amber-500/10" : "border-white/10 text-zinc-400 hover:border-white/20"}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.05]">
        {visible.map(item => {
          const conf = byProvider[item.provider];
          return (
            <div key={item.provider} className="bg-[#080808] p-5 flex flex-col" data-testid={`integration-${item.provider}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/30 grid place-items-center">
                  <Plug weight="duotone" className="text-amber-400" />
                </div>
                {conf?.secret_set && (
                  <span className="flex items-center gap-1 font-mono text-[10px] tracking-mono uppercase text-emerald-400">
                    <CheckCircle weight="fill" size={10} /> Connected
                  </span>
                )}
              </div>
              <div className="font-display text-lg tracking-tight">{item.label}</div>
              <div className="font-mono text-[10px] tracking-mono uppercase text-zinc-500">{item.category}</div>
              <div className="mt-auto pt-4 flex gap-2">
                <button onClick={() => open(item)} data-testid={`int-config-${item.provider}`}
                  className="flex-1 font-mono text-[10px] tracking-mono uppercase border border-white/10 px-3 py-2 hover:border-amber-500 hover:text-amber-400 transition">
                  {conf?.secret_set ? "Configure" : "Connect"}
                </button>
                {conf?.secret_set && (
                  <>
                    <button onClick={() => test(item.provider)} disabled={busy} data-testid={`int-test-${item.provider}`}
                      title="Test"
                      className="font-mono text-[10px] tracking-mono uppercase border border-white/10 px-3 py-2 hover:border-emerald-500 hover:text-emerald-400 transition disabled:opacity-50">
                      <ShieldCheck weight="bold" />
                    </button>
                    <button onClick={() => remove(item.provider)} data-testid={`int-remove-${item.provider}`}
                      title="Remove"
                      className="font-mono text-[10px] tracking-mono uppercase border border-white/10 px-3 py-2 hover:border-red-500 hover:text-red-400 transition">
                      <Trash weight="bold" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Config drawer */}
      {active && (
        <div className="fixed inset-0 bg-black/70 grid place-items-center z-50 p-4" onClick={close}>
          <div className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 p-6" onClick={(e) => e.stopPropagation()} data-testid="integration-modal">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-mono text-[10px] tracking-mono uppercase text-amber-400">— {active.category}</div>
                <h2 className="font-display text-2xl tracking-tighter">{active.label}</h2>
              </div>
              <button onClick={close} className="text-zinc-500 hover:text-zinc-100" data-testid="int-modal-close"><X weight="bold" /></button>
            </div>
            <div className="space-y-4">
              {active.needs.map(n => (
                <div key={n}>
                  <label className="font-mono text-[10px] tracking-mono uppercase text-zinc-500 block mb-1.5">{FIELD_LABELS[n] || n}</label>
                  <input type={n.includes("secret") || n.includes("password") || n.includes("key") ? "password" : "text"}
                    value={fields[n] || ""} onChange={(e) => setFields(f => ({ ...f, [n]: e.target.value }))}
                    data-testid={`int-field-${n}`}
                    className="w-full bg-[#050505] border border-white/10 px-4 py-2.5 font-body focus:border-amber-500 focus:outline-none transition" />
                  {byProvider[active.provider]?.fields_preview?.[n] && (
                    <div className="font-mono text-[10px] tracking-mono text-zinc-600 mt-1">Current: {byProvider[active.provider].fields_preview[n]}</div>
                  )}
                </div>
              ))}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} data-testid="int-enabled" className="accent-amber-500" />
                <span className="font-mono text-[10px] tracking-mono uppercase text-zinc-400">Enabled</span>
              </label>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={close} className="px-4 py-2.5 font-mono text-xs tracking-mono uppercase text-zinc-400 hover:text-zinc-100 transition" data-testid="int-modal-cancel">Cancel</button>
              <button onClick={save} disabled={busy} data-testid="int-modal-save"
                className="bg-amber-500 text-black px-4 py-2.5 font-mono text-xs tracking-mono uppercase hover:bg-amber-400 transition disabled:opacity-50 flex items-center gap-2">
                {busy ? <CircleNotch className="animate-spin" /> : null} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
