import { useState } from "react";
import JSZip from "jszip";
import { UploadSimple, FileArrowUp, X } from "@phosphor-icons/react";
import { toast } from "sonner";
import { api } from "../lib/api";

const TEXT_EXT = new Set(["html","htm","css","js","jsx","ts","tsx","json","md","txt","yml","yaml","xml","svg","py","php","vue","svelte","sh","env","gitignore","toml","ini","conf"]);

const isText = (path) => {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  return TEXT_EXT.has(ext);
};

export default function UploadDialog({ projectId, onClose }) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");

  const upload = async (file) => {
    setBusy(true);
    setProgress(`Reading ${file.name}…`);
    try {
      if (file.name.endsWith(".zip")) {
        const zip = await JSZip.loadAsync(file);
        const entries = Object.entries(zip.files).filter(([, f]) => !f.dir);
        let i = 0;
        for (const [path, zfile] of entries) {
          i++;
          if (!isText(path)) continue;
          setProgress(`Uploading (${i}/${entries.length}) ${path}…`);
          const content = await zfile.async("string");
          await api.post(`/projects/${projectId}/files`, { path, content });
        }
        toast.success(`Imported ${entries.length} files from ZIP`);
      } else {
        const content = await file.text();
        await api.post(`/projects/${projectId}/files`, { path: file.name, content });
        toast.success(`Uploaded ${file.name}`);
      }
      onClose?.();
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  const onDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  return (
    <div className="fixed inset-0 bg-black/70 grid place-items-center z-50 p-4" onClick={onClose} data-testid="upload-dialog">
      <div className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <div className="font-mono text-xs tracking-mono uppercase text-amber-400">— Upload</div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200" data-testid="upload-close"><X weight="bold" /></button>
        </div>
        <h2 className="font-display text-2xl tracking-tighter mb-6">Bring code into your workspace</h2>
        <label onDragOver={(e) => e.preventDefault()} onDrop={onDrop} data-testid="upload-drop-area"
          className="border border-dashed border-white/15 hover:border-amber-500/50 transition p-10 text-center block cursor-pointer">
          <FileArrowUp weight="duotone" className="text-amber-400 mx-auto mb-3" size={36} />
          <div className="font-display text-lg mb-1">Drop a ZIP or text file</div>
          <p className="text-zinc-500 text-sm">Or click to browse. ZIPs are unpacked into your project.</p>
          <input type="file" accept=".zip,.html,.css,.js,.jsx,.ts,.tsx,.json,.md,.txt,.py,.yml,.yaml,.vue,.svelte" className="hidden"
            data-testid="upload-file-input"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
        {busy && (
          <div className="mt-4 font-mono text-xs tracking-mono uppercase text-amber-400" data-testid="upload-progress">
            <UploadSimple weight="bold" className="inline mr-2" />
            {progress || "WORKING…"}
          </div>
        )}
      </div>
    </div>
  );
}
