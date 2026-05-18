import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { File, FilePlus, FloppyDisk, Play, RocketLaunch, Share, ArrowLeft, Terminal as TerminalIcon, MonitorPlay, Trash, UploadSimple, DeviceMobile, DeviceTablet, Desktop } from "@phosphor-icons/react";
import { toast } from "sonner";
import { api } from "../lib/api";
import ChatPanel from "../components/ChatPanel";
import UploadDialog from "../components/UploadDialog";

const LANG_BY_EXT = {
  js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
  json: "json", html: "html", css: "css", py: "python", md: "markdown",
  yml: "yaml", yaml: "yaml", sh: "shell", vue: "html", svelte: "html",
};
const langFor = (path) => LANG_BY_EXT[(path.split(".").pop() || "").toLowerCase()] || "plaintext";

export default function Workspace() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [active, setActive] = useState(null);
  const [openTabs, setOpenTabs] = useState([]);
  const [dirty, setDirty] = useState({});
  const [bottomTab, setBottomTab] = useState("terminal");
  const [terminalLog, setTerminalLog] = useState(["arix@workspace $ ready."]);
  const [device, setDevice] = useState("desktop");
  const [previewKey, setPreviewKey] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const iframeRef = useRef(null);

  const load = useCallback(async () => {
    const [{data: p}, {data: fs}] = await Promise.all([
      api.get(`/projects/${projectId}`),
      api.get(`/projects/${projectId}/files`),
    ]);
    setProject(p);
    setFiles(fs);
    if (!active && fs.length) {
      const first = fs.find(f => f.path === "index.html") || fs[0];
      setActive(first.path);
      setOpenTabs([first.path]);
    }
  }, [projectId, active]);

  useEffect(() => { load(); }, [load]);

  const fileMap = Object.fromEntries(files.map(f => [f.path, f]));
  const activeFile = active ? fileMap[active] : null;

  const openFile = (path) => {
    setActive(path);
    setOpenTabs((t) => t.includes(path) ? t : [...t, path]);
  };

  const closeTab = (path) => {
    setOpenTabs((t) => t.filter(x => x !== path));
    if (active === path) {
      const rest = openTabs.filter(x => x !== path);
      setActive(rest[rest.length - 1] || null);
    }
  };

  const onChange = (val) => {
    if (!activeFile) return;
    setFiles((fs) => fs.map(f => f.path === activeFile.path ? { ...f, content: val } : f));
    setDirty((d) => ({ ...d, [activeFile.path]: true }));
  };

  const save = async () => {
    if (!activeFile) return;
    try {
      await api.post(`/projects/${projectId}/files`, { path: activeFile.path, content: activeFile.content });
      setDirty((d) => { const n = { ...d }; delete n[activeFile.path]; return n; });
      toast.success(`Saved ${activeFile.path}`);
      setTerminalLog((l) => [...l, `> saved ${activeFile.path} (${activeFile.content.length} bytes)`]);
    } catch {
      toast.error("Save failed");
    }
  };

  // ctrl+s
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const newFile = async () => {
    const path = prompt("New file path (e.g. src/utils.js):");
    if (!path) return;
    try {
      const { data } = await api.post(`/projects/${projectId}/files`, { path, content: "" });
      setFiles((fs) => [...fs.filter(f => f.path !== path), data]);
      openFile(path);
      toast.success("File created");
    } catch {
      toast.error("Failed");
    }
  };

  const removeFile = async (path) => {
    if (!confirm(`Delete ${path}?`)) return;
    await api.delete(`/projects/${projectId}/files`, { params: { path } });
    setFiles((fs) => fs.filter(f => f.path !== path));
    setOpenTabs((t) => t.filter(x => x !== path));
    if (active === path) setActive(null);
  };

  const runPreview = () => {
    setPreviewKey((k) => k + 1);
    setTerminalLog((l) => [...l, "> reloading preview…", "> preview ready ✓"]);
    toast.success("Preview reloaded");
  };

  const deploy = async () => {
    try {
      await api.post("/deployments", { project_id: projectId, target: "vercel" });
      toast.success("Deployment queued");
      setTerminalLog((l) => [...l, "> deploying to vercel…", "> deployment ready ✓"]);
    } catch {
      toast.error("Deploy failed");
    }
  };

  // Build preview srcDoc for static projects: inline html with linked CSS/JS replaced
  const buildPreviewSrc = () => {
    const html = files.find(f => f.path === "index.html");
    if (!html) return "<html><body style=\"background:#050505;color:#a1a1aa;font-family:monospace;padding:24px\">No <code>index.html</code> in this project. Add one to see the live preview.</body></html>";
    let content = html.content;
    // inline css
    content = content.replace(/<link[^>]*href=["']([^"']+\.css)["'][^>]*>/g, (m, href) => {
      const css = files.find(f => f.path === href || f.path.endsWith("/" + href));
      return css ? `<style>${css.content}</style>` : m;
    });
    // inline js
    content = content.replace(/<script[^>]*src=["']([^"']+\.js)["'][^>]*><\/script>/g, (m, src) => {
      const js = files.find(f => f.path === src || f.path.endsWith("/" + src));
      return js ? `<script>${js.content}<\/script>` : m;
    });
    return content;
  };

  const deviceWidth = device === "mobile" ? 390 : device === "tablet" ? 820 : "100%";

  if (!project) {
    return <div className="h-full grid place-items-center font-mono text-xs tracking-mono uppercase text-zinc-500" data-testid="workspace-loading">LOADING WORKSPACE…</div>;
  }

  return (
    <div className="h-full flex flex-col" data-testid="workspace">
      {/* Top bar */}
      <div className="h-12 border-b border-white/5 flex items-center px-3 gap-2 bg-[#0a0a0a]">
        <button onClick={() => navigate("/dashboard/projects")} data-testid="workspace-back-button" className="text-zinc-400 hover:text-amber-400 transition p-1.5">
          <ArrowLeft weight="bold" size={16} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-amber-500/10 border border-amber-500/30 grid place-items-center"><File weight="duotone" className="text-amber-400" size={12} /></div>
          <span className="font-display text-base tracking-tight">{project.name}</span>
          <span className="font-mono text-[10px] tracking-mono uppercase text-zinc-500">/ {project.framework}</span>
        </div>
        <div className="flex-1" />
        <button onClick={save} disabled={!activeFile} data-testid="workspace-save-button" className="font-mono text-[10px] tracking-mono uppercase border border-white/10 px-3 py-1.5 hover:border-amber-500 hover:text-amber-400 transition flex items-center gap-2 disabled:opacity-40">
          <FloppyDisk weight="bold" size={12} /> Save
        </button>
        <button onClick={runPreview} data-testid="workspace-preview-button" className="font-mono text-[10px] tracking-mono uppercase border border-white/10 px-3 py-1.5 hover:border-amber-500 hover:text-amber-400 transition flex items-center gap-2">
          <Play weight="bold" size={12} /> Preview
        </button>
        <button onClick={() => setShowUpload(true)} data-testid="workspace-upload-button" className="font-mono text-[10px] tracking-mono uppercase border border-white/10 px-3 py-1.5 hover:border-amber-500 hover:text-amber-400 transition flex items-center gap-2">
          <UploadSimple weight="bold" size={12} /> Upload
        </button>
        <button data-testid="workspace-share-button" className="font-mono text-[10px] tracking-mono uppercase border border-white/10 px-3 py-1.5 hover:border-amber-500 hover:text-amber-400 transition flex items-center gap-2">
          <Share weight="bold" size={12} /> Share
        </button>
        <button onClick={deploy} data-testid="workspace-deploy-button" className="font-mono text-[10px] tracking-mono uppercase bg-amber-500 text-black px-3 py-1.5 hover:bg-amber-400 transition flex items-center gap-2 font-bold">
          <RocketLaunch weight="bold" size={12} /> Deploy
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0">
        <PanelGroup direction="horizontal">
          {/* Left: Explorer */}
          <Panel defaultSize={16} minSize={10} maxSize={30}>
            <div className="h-full bg-[#0a0a0a] border-r border-white/5 flex flex-col" data-testid="workspace-explorer">
              <div className="h-9 px-3 flex items-center justify-between border-b border-white/5">
                <span className="font-mono text-[10px] tracking-mono uppercase text-zinc-500">Explorer</span>
                <button onClick={newFile} title="New file" data-testid="explorer-new-file" className="text-zinc-400 hover:text-amber-400 transition">
                  <FilePlus weight="bold" size={14} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-1">
                {files.length === 0 && <div className="px-3 py-4 font-mono text-[10px] tracking-mono uppercase text-zinc-600">Empty</div>}
                {files.sort((a,b)=>a.path.localeCompare(b.path)).map(f => (
                  <div key={f.path} className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer font-mono text-xs transition ${active === f.path ? "bg-[#141414] text-amber-400" : "text-zinc-400 hover:bg-[#0e0e0e]"}`}
                       onClick={() => openFile(f.path)} data-testid={`file-${f.path.replace(/[^a-z0-9]/gi, '-')}`}>
                    <File weight="duotone" size={12} />
                    <span className="truncate flex-1">{f.path}</span>
                    {dirty[f.path] && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                    <button onClick={(e) => { e.stopPropagation(); removeFile(f.path); }} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400">
                      <Trash weight="bold" size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
          <PanelResizeHandle className="w-px bg-white/5 hover:bg-amber-500/40 transition" />

          {/* Center: editor + bottom panel */}
          <Panel defaultSize={52} minSize={30}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={70} minSize={30}>
                <div className="h-full flex flex-col bg-[#050505]">
                  {/* Tabs */}
                  <div className="h-9 border-b border-white/5 flex overflow-x-auto bg-[#0a0a0a]" data-testid="editor-tabs">
                    {openTabs.map(p => (
                      <div key={p} onClick={() => setActive(p)} data-testid={`tab-${p.replace(/[^a-z0-9]/gi, '-')}`}
                        className={`flex items-center gap-2 px-3 border-r border-white/5 cursor-pointer font-mono text-xs whitespace-nowrap transition ${active === p ? "bg-[#050505] text-amber-400 border-b-2 border-b-amber-500" : "text-zinc-400 hover:bg-[#0d0d0d]"}`}>
                        <File weight="duotone" size={10} />
                        {p.split("/").pop()}
                        {dirty[p] && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                        <button onClick={(e) => { e.stopPropagation(); closeTab(p); }} className="ml-1 text-zinc-500 hover:text-red-400">×</button>
                      </div>
                    ))}
                  </div>
                  {/* Editor */}
                  <div className="flex-1 min-h-0">
                    {activeFile ? (
                      <Editor
                        key={activeFile.path}
                        height="100%"
                        language={langFor(activeFile.path)}
                        theme="vs-dark"
                        value={activeFile.content}
                        onChange={onChange}
                        options={{
                          fontFamily: "JetBrains Mono, ui-monospace, monospace",
                          fontSize: 13,
                          minimap: { enabled: false },
                          smoothScrolling: true,
                          cursorBlinking: "smooth",
                          renderLineHighlight: "all",
                          scrollBeyondLastLine: false,
                          padding: { top: 16 },
                        }}
                      />
                    ) : (
                      <div className="h-full grid place-items-center text-zinc-600 font-mono text-xs tracking-mono uppercase">Select a file to start editing</div>
                    )}
                  </div>
                </div>
              </Panel>
              <PanelResizeHandle className="h-px bg-white/5 hover:bg-amber-500/40 transition" />
              {/* Bottom panel: terminal / preview tabs */}
              <Panel defaultSize={30} minSize={15}>
                <div className="h-full flex flex-col bg-[#080808]" data-testid="bottom-panel">
                  <div className="h-9 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a] pr-3">
                    <div className="flex">
                      {["terminal","preview","logs"].map(t => (
                        <button key={t} onClick={()=>setBottomTab(t)} data-testid={`bottom-tab-${t}`}
                          className={`px-4 h-9 font-mono text-[10px] tracking-mono uppercase border-r border-white/5 transition ${bottomTab === t ? "bg-[#080808] text-amber-400 border-b-2 border-b-amber-500" : "text-zinc-400 hover:bg-[#0d0d0d]"}`}>
                          {t === "terminal" && <TerminalIcon weight="bold" size={10} className="inline mr-1.5" />}
                          {t === "preview" && <MonitorPlay weight="bold" size={10} className="inline mr-1.5" />}
                          {t}
                        </button>
                      ))}
                    </div>
                    {bottomTab === "preview" && (
                      <div className="flex gap-1 items-center">
                        {[["desktop", Desktop],["tablet", DeviceTablet],["mobile", DeviceMobile]].map(([d, Icon]) => (
                          <button key={d} onClick={()=>setDevice(d)} data-testid={`device-${d}`} className={`p-1.5 ${device === d ? "text-amber-400" : "text-zinc-500 hover:text-zinc-200"}`}>
                            <Icon weight="bold" size={14} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden">
                    {bottomTab === "terminal" && (
                      <div className="h-full overflow-y-auto p-3 font-mono text-xs text-zinc-300 leading-relaxed" data-testid="terminal-output">
                        {terminalLog.map((l, i) => <div key={i}>{l}</div>)}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-amber-400">arix@workspace $</span>
                          <span className="animate-pulse">▍</span>
                        </div>
                      </div>
                    )}
                    {bottomTab === "logs" && (
                      <div className="h-full overflow-y-auto p-3 font-mono text-xs text-zinc-500 leading-relaxed" data-testid="logs-output">
                        <div>[info] Workspace ready. Hot reload on.</div>
                        <div>[info] Watching {files.length} files.</div>
                      </div>
                    )}
                    {bottomTab === "preview" && (
                      <div className="h-full grid place-items-center bg-[#050505]">
                        <div style={{ width: deviceWidth, height: "100%", maxHeight: "100%", border: device !== "desktop" ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
                          <iframe key={previewKey}
                            ref={iframeRef}
                            data-testid="preview-iframe"
                            srcDoc={buildPreviewSrc()}
                            title="preview"
                            sandbox="allow-scripts allow-same-origin allow-modals"
                            className="w-full h-full bg-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
          <PanelResizeHandle className="w-px bg-white/5 hover:bg-amber-500/40 transition" />

          {/* Right: AI Chat */}
          <Panel defaultSize={32} minSize={20}>
            <ChatPanel projectId={projectId} />
          </Panel>
        </PanelGroup>
      </div>

      {showUpload && <UploadDialog projectId={projectId} onClose={() => { setShowUpload(false); load(); }} />}
    </div>
  );
}
