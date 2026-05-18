import { useState } from "react";
import { Key, Copy, Plus } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

export default function Settings() {
  const { user } = useAuth();
  const [keys, setKeys] = useState([
    { id: "1", name: "Personal", token: "arix_sk_•••••••••••••••••••a8f2", created: "2026-01-12" },
  ]);
  const [newKey, setNewKey] = useState("");

  const create = () => {
    if (!newKey.trim()) return;
    const fake = `arix_sk_${Math.random().toString(36).substring(2, 22)}`;
    setKeys((k) => [...k, { id: String(Date.now()), name: newKey, token: fake, created: new Date().toISOString().slice(0,10) }]);
    setNewKey("");
    toast.success("API key created");
  };

  const copy = (t) => { navigator.clipboard.writeText(t); toast.success("Copied"); };

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-white/5 bg-[#080808] px-8 py-6">
        <div className="font-mono text-xs tracking-mono uppercase text-amber-400 mb-1">— Settings</div>
        <h1 className="font-display text-3xl tracking-tighter">Account & API keys</h1>
      </div>

      <div className="p-8 space-y-10 max-w-3xl">
        {/* Profile */}
        <section data-testid="settings-profile">
          <div className="font-mono text-xs tracking-mono uppercase text-zinc-500 mb-3">— Profile</div>
          <div className="border border-white/10 p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[10px] tracking-mono uppercase text-zinc-500 block mb-1.5">Full name</label>
                <input defaultValue={user?.name} className="w-full bg-[#050505] border border-white/10 px-4 py-2.5 font-body" />
              </div>
              <div>
                <label className="font-mono text-[10px] tracking-mono uppercase text-zinc-500 block mb-1.5">Email</label>
                <input defaultValue={user?.email} disabled className="w-full bg-[#050505] border border-white/10 px-4 py-2.5 font-body text-zinc-500" />
              </div>
            </div>
            <button data-testid="settings-save-profile"
              className="bg-amber-500 text-black px-4 py-2.5 font-mono text-xs tracking-mono uppercase hover:bg-amber-400 transition">
              Save changes
            </button>
          </div>
        </section>

        {/* API Keys */}
        <section data-testid="settings-api-keys">
          <div className="font-mono text-xs tracking-mono uppercase text-zinc-500 mb-3">— API Keys</div>
          <div className="border border-white/10 p-6">
            <div className="flex gap-2 mb-5">
              <input value={newKey} onChange={(e)=>setNewKey(e.target.value)} placeholder="Key name…" data-testid="settings-new-key-input"
                className="flex-1 bg-[#050505] border border-white/10 px-4 py-2.5 font-body focus:border-amber-500 focus:outline-none transition" />
              <button onClick={create} data-testid="settings-new-key-button"
                className="bg-amber-500 text-black px-4 py-2.5 font-mono text-xs tracking-mono uppercase hover:bg-amber-400 transition flex items-center gap-2">
                <Plus weight="bold" /> Create
              </button>
            </div>
            <div className="space-y-2">
              {keys.map(k => (
                <div key={k.id} className="flex items-center gap-3 bg-[#050505] border border-white/5 p-3" data-testid={`api-key-row-${k.id}`}>
                  <Key weight="duotone" className="text-amber-400" />
                  <div className="flex-1 min-w-0">
                    <div className="font-body text-sm">{k.name}</div>
                    <code className="font-mono text-xs text-zinc-500 truncate block">{k.token}</code>
                  </div>
                  <span className="font-mono text-[10px] tracking-mono uppercase text-zinc-500">{k.created}</span>
                  <button onClick={()=>copy(k.token)} data-testid={`api-key-copy-${k.id}`} className="text-zinc-400 hover:text-amber-400 transition p-2"><Copy weight="bold" size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
