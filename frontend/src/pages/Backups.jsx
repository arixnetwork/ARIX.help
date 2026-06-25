import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Database, Plus, ArrowCounterClockwise, Trash, Clock, CircleNotch } from "@phosphor-icons/react";
import { api } from "../lib/api";

export default function Backups() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");

  const load = async () => {
    const { data } = await api.get("/backups");
    setItems(data);
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e?.preventDefault();
    setBusy(true);
    try {
      await api.post("/backups", { name: name.trim() || null });
      toast.success("Backup created");
      setName("");
      load();
    } catch { toast.error("Backup failed"); }
    finally { setBusy(false); }
  };

  const restore = async (id) => {
    if (!confirm(`Restore from ${id}? This will OVERWRITE all current data.`)) return;
    setBusy(true);
    try {
      await api.post(`/backups/${id}/restore`);
      toast.success("Restored");
    } catch { toast.error("Restore failed"); }
    finally { setBusy(false); }
  };

  const remove = async (id) => {
    if (!confirm(`Delete backup ${id}?`)) return;
    await api.delete(`/backups/${id}`);
    toast.success("Deleted");
    load();
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-white/5 bg-[#080808] px-8 py-6 flex justify-between items-center">
        <div>
          <div className="font-mono text-xs tracking-mono uppercase text-amber-400 mb-1">— Backup Manager</div>
          <h1 className="font-display text-3xl tracking-tighter">Snapshots</h1>
        </div>
      </div>
      <div className="p-8 space-y-8">
        <form onSubmit={create} className="flex gap-3" data-testid="backup-form">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Backup name (optional)"
            data-testid="backup-name-input"
            className="flex-1 bg-[#0a0a0a] border border-white/10 px-4 py-2.5 font-body focus:border-amber-500 focus:outline-none transition" />
          <button type="submit" disabled={busy} data-testid="backup-create-button"
            className="bg-amber-500 text-black px-4 py-2.5 font-mono text-xs tracking-mono uppercase hover:bg-amber-400 transition flex items-center gap-2 disabled:opacity-50">
            {busy ? <CircleNotch className="animate-spin" /> : <Plus weight="bold" />} Create backup
          </button>
        </form>

        {items.length === 0 ? (
          <div className="border border-white/10 border-dashed p-16 text-center" data-testid="backup-empty">
            <Database weight="duotone" size={48} className="text-zinc-700 mx-auto mb-4" />
            <div className="font-display text-2xl tracking-tighter mb-2">No backups yet</div>
            <p className="text-zinc-500">Create your first snapshot to enable rollback and update safety.</p>
          </div>
        ) : (
          <div className="border border-white/10 divide-y divide-white/5" data-testid="backup-list">
            {items.map(b => (
              <div key={b.id} className="px-4 py-3 flex items-center justify-between gap-4" data-testid={`backup-row-${b.id}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <Database weight="duotone" className="text-amber-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-body text-sm truncate">{b.name}</div>
                    <div className="font-mono text-[10px] tracking-mono uppercase text-zinc-500 flex items-center gap-1">
                      <Clock size={10} /> {new Date(b.created_at).toLocaleString()} · {b.size_kb} KB
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => restore(b.id)} disabled={busy} data-testid={`backup-restore-${b.id}`}
                    className="font-mono text-[10px] tracking-mono uppercase border border-white/10 px-3 py-2 hover:border-amber-500 hover:text-amber-400 transition disabled:opacity-50 flex items-center gap-2">
                    <ArrowCounterClockwise weight="bold" /> Restore
                  </button>
                  <button onClick={() => remove(b.id)} data-testid={`backup-delete-${b.id}`}
                    className="font-mono text-[10px] tracking-mono uppercase border border-white/10 px-3 py-2 hover:border-red-500 hover:text-red-400 transition">
                    <Trash weight="bold" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
