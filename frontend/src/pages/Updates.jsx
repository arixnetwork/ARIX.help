import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, CheckCircle, ArrowsClockwise, CircleNotch, Package } from "@phosphor-icons/react";
import { api } from "../lib/api";

export default function Updates() {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const check = async () => {
    const { data } = await api.get("/updates/status");
    setStatus(data);
  };
  useEffect(() => { check(); }, []);

  const run = async () => {
    if (!confirm("Run update? A backup will be created automatically before applying.")) return;
    setBusy(true);
    try {
      const { data } = await api.post("/updates/run");
      setResult(data);
      toast.success("Update completed");
    } catch { toast.error("Update failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-white/5 bg-[#080808] px-8 py-6 flex justify-between items-center">
        <div>
          <div className="font-mono text-xs tracking-mono uppercase text-amber-400 mb-1">— Update Manager</div>
          <h1 className="font-display text-3xl tracking-tighter">Software updates</h1>
        </div>
        <button onClick={check} disabled={busy} data-testid="updates-check"
          className="font-mono text-xs tracking-mono uppercase border border-white/10 px-4 py-2.5 hover:border-amber-500 hover:text-amber-400 transition flex items-center gap-2 disabled:opacity-50">
          <ArrowsClockwise weight="bold" /> Check
        </button>
      </div>
      <div className="p-8 max-w-3xl space-y-6">
        {status && (
          <div className={`border ${status.update_available ? "border-amber-500/30 bg-amber-500/5" : "border-emerald-500/30 bg-emerald-500/5"} p-6`} data-testid="updates-status">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Package weight="duotone" className={status.update_available ? "text-amber-400" : "text-emerald-400"} size={28} />
                <div>
                  <div className="font-display text-2xl tracking-tighter">{status.update_available ? "Update available" : "You're up to date"}</div>
                  <div className="font-mono text-[10px] tracking-mono uppercase text-zinc-500 mt-1">
                    Current v{status.current_version} · Available v{status.available_version} · Channel {status.channel}
                  </div>
                </div>
              </div>
              {status.update_available && (
                <button onClick={run} disabled={busy} data-testid="updates-run"
                  className="bg-amber-500 text-black px-5 py-3 font-mono text-xs tracking-mono uppercase font-bold hover:bg-amber-400 transition flex items-center gap-2 disabled:opacity-50">
                  {busy ? <CircleNotch className="animate-spin" /> : <Download weight="bold" />} Update now
                </button>
              )}
            </div>
          </div>
        )}

        {result && (
          <div className="border border-white/10 divide-y divide-white/5" data-testid="update-result">
            {result.steps.map((s, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle weight="fill" className="text-emerald-400" />
                  <span className="text-sm">{s.step}</span>
                </div>
                <span className="font-mono text-[10px] tracking-mono uppercase text-zinc-500">{s.note || "OK"}</span>
              </div>
            ))}
          </div>
        )}

        <div className="border border-white/10 bg-[#080808] p-5">
          <div className="font-mono text-[10px] tracking-mono uppercase text-amber-400 mb-2">How updates work</div>
          <ol className="text-sm text-zinc-300 space-y-1.5 list-decimal pl-5">
            <li>A full backup is created before any change.</li>
            <li>The update manifest is fetched and verified.</li>
            <li>Migrations run automatically.</li>
            <li>Services are restarted.</li>
            <li>If anything fails, restore the pre-update backup with one click.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
