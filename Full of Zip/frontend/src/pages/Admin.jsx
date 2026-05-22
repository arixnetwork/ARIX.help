import { useEffect, useState } from "react";
import { ShieldStar, UsersThree, FolderOpen, ChatCircleText, RocketLaunch } from "@phosphor-icons/react";
import { api } from "../lib/api";

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.get("/admin/stats")
      .then(({data}) => setStats(data))
      .catch((e) => setErr(e.response?.data?.detail || "Forbidden"));
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-white/5 bg-[#080808] px-8 py-6 flex items-center gap-3">
        <ShieldStar weight="fill" className="text-amber-500" size={28} />
        <div>
          <div className="font-mono text-xs tracking-mono uppercase text-amber-400 mb-1">— Admin panel</div>
          <h1 className="font-display text-3xl tracking-tighter">Platform overview</h1>
        </div>
      </div>
      <div className="p-8">
        {err && <div className="border border-red-500/30 bg-red-500/10 p-4 text-red-300 font-mono text-xs" data-testid="admin-error">{err}</div>}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.05]">
            {[
              {label:"Users", val: stats.users, icon: UsersThree},
              {label:"Projects", val: stats.projects, icon: FolderOpen},
              {label:"Chats", val: stats.chats, icon: ChatCircleText},
              {label:"Deployments", val: stats.deployments, icon: RocketLaunch},
            ].map((s) => (
              <div key={s.label} className="bg-[#080808] p-6">
                <s.icon weight="duotone" className="text-amber-400 mb-3" size={20} />
                <div className="font-display text-4xl tracking-tighter">{s.val}</div>
                <div className="font-mono text-[10px] tracking-mono uppercase text-zinc-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
