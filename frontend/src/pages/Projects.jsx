import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FolderOpen, Trash, ArrowRight } from "@phosphor-icons/react";
import { toast } from "sonner";
import { api } from "../lib/api";

const FRAMEWORKS = [
  { id: "static", label: "Static HTML / CSS / JS" },
  { id: "react", label: "React" },
  { id: "nextjs", label: "Next.js" },
  { id: "vue", label: "Vue" },
  { id: "node", label: "Node.js" },
  { id: "fastapi", label: "FastAPI" },
];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [framework, setFramework] = useState("static");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/projects");
      setProjects(data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e?.preventDefault();
    if (!name.trim()) return;
    try {
      const { data } = await api.post("/projects", { name: name.trim(), framework, description });
      toast.success("Project created");
      navigate(`/dashboard/projects/${data.project_id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this project?")) return;
    await api.delete(`/projects/${id}`);
    toast.success("Project deleted");
    load();
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-white/5 bg-[#080808] px-8 py-6 flex items-center justify-between" data-testid="projects-header">
        <div>
          <div className="font-mono text-xs tracking-mono uppercase text-amber-400 mb-1">— Projects</div>
          <h1 className="font-display text-3xl tracking-tighter">Your workspaces</h1>
        </div>
        <button onClick={() => setShowNew(true)} data-testid="new-project-button"
          className="bg-amber-500 text-black px-4 py-2.5 font-mono text-xs tracking-mono uppercase hover:bg-amber-400 transition flex items-center gap-2">
          <Plus weight="bold" /> New project
        </button>
      </div>

      <div className="p-8">
        {loading && <div className="font-mono text-xs tracking-mono uppercase text-zinc-500">LOADING…</div>}
        {!loading && projects.length === 0 && (
          <div className="border border-white/10 border-dashed p-16 text-center" data-testid="projects-empty">
            <FolderOpen weight="duotone" size={48} className="text-zinc-700 mx-auto mb-4" />
            <div className="font-display text-2xl tracking-tighter mb-2">No projects yet</div>
            <p className="text-zinc-500 mb-6">Create your first workspace to start building with AI.</p>
            <button onClick={() => setShowNew(true)} data-testid="empty-new-project-button"
              className="bg-amber-500 text-black px-5 py-3 font-mono text-xs tracking-mono uppercase hover:bg-amber-400 transition">
              Create project
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.05]">
          {projects.map((p) => (
            <div key={p.project_id} className="bg-[#080808] p-6 group hover:bg-[#0c0c0c] transition flex flex-col" data-testid={`project-card-${p.project_id}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/30 grid place-items-center">
                  <FolderOpen weight="duotone" className="text-amber-400" size={18} />
                </div>
                <button onClick={() => remove(p.project_id)} data-testid={`project-delete-${p.project_id}`}
                  className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition">
                  <Trash weight="bold" size={14} />
                </button>
              </div>
              <div className="font-display text-xl tracking-tight">{p.name}</div>
              <div className="font-mono text-[10px] tracking-mono uppercase text-zinc-500 mt-1">{p.framework}</div>
              {p.description && <p className="text-sm text-zinc-400 mt-3 line-clamp-2">{p.description}</p>}
              <div className="mt-auto pt-6 flex items-center justify-between">
                <div className="font-mono text-[10px] tracking-mono uppercase text-zinc-600">
                  Updated {new Date(p.updated_at).toLocaleDateString()}
                </div>
                <button onClick={() => navigate(`/dashboard/projects/${p.project_id}`)}
                  data-testid={`project-open-${p.project_id}`}
                  className="font-mono text-[10px] tracking-mono uppercase text-amber-400 hover:text-amber-300 flex items-center gap-1">
                  Open <ArrowRight weight="bold" size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New project modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/70 grid place-items-center z-50 p-4" onClick={() => setShowNew(false)}>
          <form onSubmit={create} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-[#0a0a0a] border border-white/10 p-6" data-testid="new-project-modal">
            <div className="font-mono text-xs tracking-mono uppercase text-amber-400 mb-2">— New project</div>
            <h2 className="font-display text-2xl tracking-tighter mb-6">Create a workspace</h2>
            <div className="space-y-4">
              <div>
                <label className="font-mono text-[10px] tracking-mono uppercase text-zinc-500 block mb-1.5">Name</label>
                <input data-testid="new-project-name" value={name} onChange={(e)=>setName(e.target.value)} required
                  className="w-full bg-[#050505] border border-white/10 px-4 py-2.5 font-body focus:border-amber-500 focus:outline-none transition" />
              </div>
              <div>
                <label className="font-mono text-[10px] tracking-mono uppercase text-zinc-500 block mb-1.5">Framework</label>
                <select data-testid="new-project-framework" value={framework} onChange={(e)=>setFramework(e.target.value)}
                  className="w-full bg-[#050505] border border-white/10 px-4 py-2.5 font-body focus:border-amber-500 focus:outline-none transition">
                  {FRAMEWORKS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="font-mono text-[10px] tracking-mono uppercase text-zinc-500 block mb-1.5">Description</label>
                <textarea data-testid="new-project-description" value={description} onChange={(e)=>setDescription(e.target.value)} rows={3}
                  className="w-full bg-[#050505] border border-white/10 px-4 py-2.5 font-body focus:border-amber-500 focus:outline-none transition resize-none" />
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowNew(false)} data-testid="new-project-cancel"
                className="px-4 py-2.5 font-mono text-xs tracking-mono uppercase text-zinc-400 hover:text-zinc-100 transition">Cancel</button>
              <button type="submit" data-testid="new-project-create"
                className="bg-amber-500 text-black px-4 py-2.5 font-mono text-xs tracking-mono uppercase hover:bg-amber-400 transition">
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
