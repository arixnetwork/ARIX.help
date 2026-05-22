import { useEffect, useState } from "react";
import { RocketLaunch, CheckCircle, ArrowSquareOut, ArrowsClockwise } from "@phosphor-icons/react";
import { toast } from "sonner";
import { api } from "../lib/api";

export default function Deployments() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [picking, setPicking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState("vercel");
  const [pid, setPid] = useState("");
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    const [{data: deps}, {data: prs}] = await Promise.all([
      api.get("/deployments"),
      api.get("/projects"),
    ]);
    setItems(deps); setProjects(prs);
    if (prs.length) setPid(prs[0].project_id);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const deploy = async (e) => {
    e?.preventDefault();
    if (!pid) { toast.error("Create a project first"); return; }
    try {
      await api.post("/deployments", { project_id: pid, target });
      toast.success("Deployment ready");
      setPicking(false);
      load();
    } catch {
      toast.error("Deploy failed");
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-white/5 bg-[#080808] px-8 py-6 flex justify-between items-center">
        <div>
          <div className="font-mono text-xs tracking-mono uppercase text-amber-400 mb-1">— Deployments</div>
          <h1 className="font-display text-3xl tracking-tighter">Ship to the world</h1>
        </div>
        <button onClick={() => setPicking(true)} data-testid="deploy-new-button"
          className="bg-amber-500 text-black px-4 py-2.5 font-mono text-xs tracking-mono uppercase hover:bg-amber-400 transition flex items-center gap-2">
          <RocketLaunch weight="bold" /> New deployment
        </button>
      </div>

      <div className="p-8">
        {loading && <div className="font-mono text-xs tracking-mono uppercase text-zinc-500">LOADING…</div>}
        {!loading && items.length === 0 && (
          <div className="border border-white/10 border-dashed p-16 text-center" data-testid="deployments-empty">
            <RocketLaunch weight="duotone" size={48} className="text-zinc-700 mx-auto mb-4" />
            <div className="font-display text-2xl tracking-tighter mb-2">No deployments yet</div>
            <p className="text-zinc-500">Deploy a project to see it live with SSL in seconds.</p>
          </div>
        )}
        <div className="space-y-px bg-white/[0.05]">
          {items.map((d) => (
            <div key={d.deployment_id} className="bg-[#080808] p-5" data-testid={`deployment-row-${d.deployment_id}`}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/30 grid place-items-center">
                    <CheckCircle weight="fill" className="text-emerald-400" size={18} />
                  </div>
                  <div>
                    <div className="font-display text-lg tracking-tight">{d.project_name}</div>
                    <div className="font-mono text-[10px] tracking-mono uppercase text-zinc-500">{d.target} · {new Date(d.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <a href={d.url} target="_blank" rel="noreferrer" className="font-mono text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1" data-testid={`deployment-url-${d.deployment_id}`}>
                    {d.url.replace("https://", "")} <ArrowSquareOut weight="bold" size={12} />
                  </a>
                  <button onClick={() => setExpanded(expanded === d.deployment_id ? null : d.deployment_id)} data-testid={`deployment-logs-${d.deployment_id}`}
                    className="font-mono text-[10px] tracking-mono uppercase border border-white/10 px-3 py-1.5 hover:border-amber-500 transition">
                    Logs
                  </button>
                </div>
              </div>
              {expanded === d.deployment_id && (
                <pre className="mt-4 bg-[#050505] border border-white/5 p-4 font-mono text-xs text-zinc-300 leading-relaxed">{d.logs.join("\n")}</pre>
              )}
            </div>
          ))}
        </div>
      </div>

      {picking && (
        <div className="fixed inset-0 bg-black/70 grid place-items-center z-50 p-4" onClick={() => setPicking(false)}>
          <form onSubmit={deploy} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-[#0a0a0a] border border-white/10 p-6" data-testid="deploy-modal">
            <div className="font-mono text-xs tracking-mono uppercase text-amber-400 mb-2">— Deploy</div>
            <h2 className="font-display text-2xl tracking-tighter mb-6">New deployment</h2>
            <div className="space-y-4">
              <div>
                <label className="font-mono text-[10px] tracking-mono uppercase text-zinc-500 block mb-1.5">Project</label>
                <select value={pid} onChange={(e)=>setPid(e.target.value)} data-testid="deploy-project-select"
                  className="w-full bg-[#050505] border border-white/10 px-4 py-2.5 font-body focus:border-amber-500 focus:outline-none transition">
                  {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="font-mono text-[10px] tracking-mono uppercase text-zinc-500 block mb-1.5">Target</label>
                <div className="grid grid-cols-3 gap-2">
                  {["vercel","netlify","aws"].map(t => (
                    <button type="button" key={t} onClick={()=>setTarget(t)} data-testid={`deploy-target-${t}`}
                      className={`px-3 py-2.5 font-mono text-[10px] tracking-mono uppercase border transition ${target === t ? "border-amber-500 text-amber-400 bg-amber-500/10" : "border-white/10 text-zinc-400 hover:border-white/20"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button type="button" onClick={()=>setPicking(false)} className="px-4 py-2.5 font-mono text-xs tracking-mono uppercase text-zinc-400 hover:text-zinc-100 transition">Cancel</button>
              <button type="submit" data-testid="deploy-submit-button"
                className="bg-amber-500 text-black px-4 py-2.5 font-mono text-xs tracking-mono uppercase hover:bg-amber-400 transition flex items-center gap-2">
                <ArrowsClockwise weight="bold" /> Deploy
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
