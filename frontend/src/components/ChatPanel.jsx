import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { PaperPlaneRight, Sparkle, Cpu } from "@phosphor-icons/react";
import { api } from "../lib/api";

const MODELS = [
  { id: "claude-sonnet-4-5-20250929", provider: "anthropic", label: "Claude Sonnet 4.5" },
  { id: "gpt-5.2", provider: "openai", label: "GPT-5.2" },
  { id: "gemini-3.1-pro-preview", provider: "gemini", label: "Gemini 3 Pro" },
];

export default function ChatPanel({ chatId, projectId, compact = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [model, setModel] = useState(MODELS[0]);
  const [activeChatId, setActiveChatId] = useState(chatId);
  const scrollRef = useRef(null);

  useEffect(() => { setActiveChatId(chatId); }, [chatId]);

  useEffect(() => {
    if (!activeChatId) { setMessages([]); return; }
    api.get(`/chats/${activeChatId}/messages`).then(({data}) => setMessages(data)).catch(() => setMessages([]));
  }, [activeChatId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const ensureChat = async () => {
    if (activeChatId) return activeChatId;
    const { data } = await api.post("/chats", { title: "New Chat", project_id: projectId || null });
    setActiveChatId(data.chat_id);
    return data.chat_id;
  };

  const send = async (e) => {
    e?.preventDefault?.();
    if (!input.trim() || busy) return;
    const text = input.trim();
    setInput("");
    setBusy(true);
    const id = await ensureChat();
    // Optimistic
    setMessages((m) => [...m, { message_id: `tmp-${Date.now()}`, role: "user", content: text, model: model.id, created_at: new Date().toISOString() }]);
    try {
      const { data } = await api.post(`/chats/${id}/messages`, { content: text, model: model.id, provider: model.provider });
      setMessages((m) => [...m.filter(x => !String(x.message_id).startsWith("tmp-")), data.user_message, data.assistant_message]);
    } catch (err) {
      setMessages((m) => [...m, { message_id: `err-${Date.now()}`, role: "assistant", content: "_Error contacting AI. Please retry._", created_at: new Date().toISOString() }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]" data-testid="chat-panel">
      {/* Header */}
      <div className="h-11 border-b border-white/5 px-4 flex items-center justify-between bg-[#0d0d0d]">
        <div className="flex items-center gap-2">
          <Sparkle weight="fill" className="text-amber-500" size={14} />
          <span className="font-mono text-[10px] tracking-mono uppercase text-zinc-400">AI Assistant</span>
        </div>
        <div className="relative group">
          <button data-testid="chat-model-selector" className="flex items-center gap-2 font-mono text-[10px] tracking-mono uppercase text-amber-400 border border-white/10 px-2 py-1 hover:border-amber-500 transition">
            <Cpu weight="bold" size={12} /> {model.label}
          </button>
          <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-[#0d0d0d] border border-white/10 z-20 min-w-[180px]">
            {MODELS.map((m) => (
              <button key={m.id} onClick={() => setModel(m)} data-testid={`chat-model-${m.id}`}
                className={`block w-full text-left px-3 py-2 font-mono text-[10px] tracking-mono uppercase hover:bg-[#141414] ${m.id === model.id ? "text-amber-400" : "text-zinc-400"}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4" data-testid="chat-messages">
        {messages.length === 0 && !busy && (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 py-12">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 grid place-items-center mb-4">
              <Sparkle weight="duotone" className="text-amber-400" size={24} />
            </div>
            <div className="font-display text-xl mb-1">Ask Arix anything</div>
            <p className="text-zinc-500 text-sm max-w-xs">Fix bugs, refactor code, generate components, explain unfamiliar files — all in one place.</p>
          </div>
        )}
        {messages.map((m) => (
          <Message key={m.message_id} m={m} compact={compact} />
        ))}
        {busy && (
          <div className="flex gap-3" data-testid="chat-thinking">
            <div className="w-7 h-7 bg-amber-500/10 border border-amber-500/30 grid place-items-center shrink-0">
              <Sparkle weight="fill" className="text-amber-400" size={12} />
            </div>
            <div className="font-mono text-xs tracking-mono uppercase text-zinc-500 pt-1.5">
              Thinking<span className="animate-pulse">…</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={send} className="border-t border-white/5 p-3 pr-32 bg-[#0a0a0a]">
        <div className="border border-white/10 focus-within:border-amber-500 transition flex items-end gap-2 p-2">
          <textarea data-testid="chat-input"
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e); } }}
            placeholder="Ask Arix… (Shift+Enter for newline)"
            rows={1}
            className="flex-1 bg-transparent resize-none font-body text-sm placeholder-zinc-600 focus:outline-none px-2 py-1.5 max-h-32" />
          <button type="submit" disabled={busy || !input.trim()} data-testid="chat-send-button" aria-label="Send message"
            className="bg-amber-500 text-black p-2 hover:bg-amber-400 transition disabled:opacity-40 disabled:cursor-not-allowed">
            <PaperPlaneRight weight="fill" size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

function Message({ m, compact }) {
  const isUser = m.role === "user";
  return (
    <div className="flex gap-3" data-testid={`chat-message-${m.role}`}>
      <div className={`w-7 h-7 grid place-items-center shrink-0 ${isUser ? "bg-zinc-800" : "bg-amber-500/10 border border-amber-500/30"}`}>
        {isUser ? <span className="font-mono text-[10px] text-zinc-300">U</span> : <Sparkle weight="fill" className="text-amber-400" size={12} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[10px] tracking-mono uppercase text-zinc-500 mb-1">
          {isUser ? "You" : m.model || "Arix"}
        </div>
        <div className={`markdown-body ${compact ? "text-sm" : "text-sm"} text-zinc-200 break-words`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
            code({inline, className, children, ...props}) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" customStyle={{margin: 0, background: "#0a0a0a", fontSize: 12}} {...props}>
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>{children}</code>
              );
            }
          }}>
            {m.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
