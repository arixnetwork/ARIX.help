import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Activity, CheckCircle, WarningCircle, ArrowsClockwise, Wrench } from "@phosphor-icons/react";
import { api } from "../lib/api";

export default function Diagnostics() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [repairLog, setRepairLog] = useState([]);

  const run = async () => {
    setBusy(true);
    try {
      const { data } = await api.get("/system/diagnostics");
      setData(data);
    } catch (e) { toast.error("Failed to run diagnostics"); }
    finally { setBusy(false); }
  };

  const repair = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/system/repair");
      setRepairLog(data.actions);
      data.ok ? toast.success("Repair complete") : toast.error("Some repairs failed");
      run();
    } catch { toast.error("Repair failed"); }
    finally { setBusy(false); }
  };

  useEffect(() => { run(); }, []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-white/5 bg-[#080808] px-8 py-6 flex justify-between items-center">
        <div>
          <div className="font-mono text-xs tracking-mono uppercase text-amber-400 mb-1">— Diagnostics</div>
          <h1 className="font-display text-3xl tracking-tighter">System health</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={run} disabled={busy} data-testid="diag-rerun"
            className="font-mono text-xs tracking-mono uppercase border border-white/10 px-4 py-2.5 hover:border-amber-500 hover:text-amber-400 transition flex items-center gap-2 disabled:opacity-50">
            <ArrowsClockwise weight="bold" /> Rerun
          </button>
          <button onClick={repair} disabled={busy} data-testid="diag-repair"
            className="bg-amber-500 text-black px-4 py-2.5 font-mono text-xs tracking-mono uppercase hover:bg-amber-400 transition flex items-center gap-2 disabled:opacity-50">
            <Wrench weight="bold" /> Auto-repair
          </button>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-px bg-white/[0.05]">
            <Tile label="Health score" value={`${data.score}%`} accent />
            <Tile label="Total checks" value={data.total} />
            <Tile label="Healthy" value={data.healthy} ok />
            <Tile label="Issues" value={data.unhealthy} ok={data.unhealthy === 0} />
          </div>
        )}

        {data && (
          <div className="border border-white/10 divide-y divide-white/5" data-testid="diagnostics-list">
            {data.checks.map((c, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between gap-4" data-testid={`diag-check-${i}`}>
                <div className="flex items-center gap-3 min-w-0">
                  {c.ok
                    ? <CheckCircle weight="fill" className="text-emerald-400 flex-shrink-0" />
                    : <WarningCircle weight="fill" className="text-red-400 flex-shrink-0" />
                  }
                  <div className="min-w-0">
                    <div className="text-sm truncate">{c.name}</div>
                    {c.message && !c.ok && <div className="font-mono text-[10px] tracking-mono uppercase text-zinc-500 mt-0.5 truncate">{c.message}</div>}
                  </div>
                </div>
                <span className="font-mono text-xs text-zinc-400 truncate flex-shrink-0">{c.value}</span>
              </div>
            ))}
          </div>
        )}

        {repairLog.length > 0 && (
          <div className="border border-amber-500/30 bg-amber-500/5 p-4" data-testid="repair-log">
            <div className="font-mono text-[10px] tracking-mono uppercase text-amber-400 mb-3">Last repair</div>
            <ul className="space-y-1.5">
              {repairLog.map((a, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-mono">
                  {a.ok
                    ? <CheckCircle weight="fill" className="text-emerald-400" size={14} />
                    : <WarningCircle weight="fill" className="text-red-400" size={14} />
                  }
                  <span>{a.action}</span>
                  {a.error && <span className="text-red-400 text-xs">— {a.error}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Tile({ label, value, accent, ok }) {
  return (
    <div className="bg-[#080808] p-5">
      <div className="font-mono text-[10px] tracking-mono uppercase text-zinc-500">{label}</div>
      <div className={`font-display text-4xl tracking-tighter mt-1 ${accent ? "text-amber-400" : ok === false ? "text-red-400" : ok === true ? "text-emerald-400" : ""}`}>{value}</div>
    </div>
  );
}
