import { useEffect, useState } from "react";
import { Stack, ArrowRight, Star } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function Templates() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("All");
  const navigate = useNavigate();

  useEffect(() => { api.get("/templates").then(({data}) => setItems(data)); }, []);

  const cats = ["All", ...new Set(items.map(i => i.category))];
  const filtered = filter === "All" ? items : items.filter(i => i.category === filter);

  const applyTemplate = async (t) => {
    try {
      const { data } = await api.post("/projects", { name: `${t.name} Starter`, framework: t.framework, description: t.description });
      toast.success("Project created from template");
      navigate(`/dashboard/projects/${data.project_id}`);
    } catch {
      toast.error("Failed to create");
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-white/5 bg-[#080808] px-8 py-6">
        <div className="font-mono text-xs tracking-mono uppercase text-amber-400 mb-1">— Templates</div>
        <h1 className="font-display text-3xl tracking-tighter">Start from a battle-tested stack</h1>
        <p className="text-zinc-400 mt-2">{items.length} starters across web, backend, CMS, DevOps, and mobile.</p>
      </div>
      <div className="px-8 py-4 flex gap-2 border-b border-white/5 overflow-x-auto" data-testid="template-filters">
        {cats.map(c => (
          <button key={c} onClick={() => setFilter(c)} data-testid={`template-filter-${c.toLowerCase()}`}
            className={`px-3 py-1.5 font-mono text-[10px] tracking-mono uppercase border transition ${filter === c ? "border-amber-500 text-amber-400 bg-amber-500/10" : "border-white/10 text-zinc-400 hover:border-white/20"}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.05]">
        {filtered.map((t) => (
          <div key={t.id} className="bg-[#080808] p-6 group hover:bg-[#0c0c0c] transition flex flex-col" data-testid={`template-card-${t.id}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/30 grid place-items-center">
                <Stack weight="duotone" className="text-amber-400" size={18} />
              </div>
              <div className="flex items-center gap-1 font-mono text-[10px] tracking-mono uppercase text-zinc-500">
                <Star weight="fill" size={10} className="text-amber-500" /> {t.stars}
              </div>
            </div>
            <div className="font-display text-xl tracking-tight">{t.name}</div>
            <div className="font-mono text-[10px] tracking-mono uppercase text-zinc-500 mt-1">{t.category}</div>
            <p className="text-sm text-zinc-400 mt-3 line-clamp-2">{t.description}</p>
            <button onClick={() => applyTemplate(t)} data-testid={`template-use-${t.id}`}
              className="mt-auto pt-6 self-start font-mono text-[10px] tracking-mono uppercase text-amber-400 hover:text-amber-300 flex items-center gap-1">
              Use template <ArrowRight weight="bold" size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
