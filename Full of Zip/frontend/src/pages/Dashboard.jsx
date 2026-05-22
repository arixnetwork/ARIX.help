import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ChatCircleText } from "@phosphor-icons/react";
import { api } from "../lib/api";
import ChatPanel from "../components/ChatPanel";

export default function Dashboard() {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    try {
      const { data } = await api.get("/chats");
      setChats(data);
      if (!activeChat && data.length) setActiveChat(data[0].chat_id);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, []);

  const newChat = async () => {
    const { data } = await api.post("/chats", { title: "New Chat" });
    setChats((c) => [data, ...c]);
    setActiveChat(data.chat_id);
  };

  return (
    <div className="flex h-full">
      {/* Chat list */}
      <div className="w-64 border-r border-white/5 bg-[#080808] flex flex-col" data-testid="dashboard-chat-list">
        <div className="h-14 px-4 flex items-center justify-between border-b border-white/5">
          <div className="font-mono text-xs tracking-mono uppercase text-zinc-400">AI Chats</div>
          <button onClick={newChat} data-testid="new-chat-button" className="text-amber-400 hover:text-amber-300 transition" title="New chat">
            <Plus weight="bold" size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {loading && <div className="font-mono text-[10px] tracking-mono uppercase text-zinc-600 px-3 py-2">LOADING…</div>}
          {!loading && chats.length === 0 && (
            <div className="text-center text-zinc-600 py-12 px-4">
              <ChatCircleText weight="duotone" size={32} className="mx-auto mb-3 text-zinc-700" />
              <div className="font-mono text-[10px] tracking-mono uppercase mb-3">No chats yet</div>
              <button onClick={newChat} data-testid="empty-new-chat-button" className="bg-amber-500 text-black px-3 py-2 font-mono text-[10px] tracking-mono uppercase hover:bg-amber-400 transition">
                Start a new chat
              </button>
            </div>
          )}
          {chats.map((c) => (
            <button key={c.chat_id} onClick={() => setActiveChat(c.chat_id)} data-testid={`chat-item-${c.chat_id}`}
              className={`block w-full text-left px-3 py-2 rounded-sm transition ${activeChat === c.chat_id ? "bg-[#141414] text-amber-400" : "text-zinc-300 hover:bg-[#0e0e0e]"}`}>
              <div className="font-body text-sm truncate">{c.title}</div>
              <div className="font-mono text-[10px] tracking-mono uppercase text-zinc-500 truncate">
                {new Date(c.created_at).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active chat */}
      <div className="flex-1">
        {activeChat ? (
          <ChatPanel chatId={activeChat} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center px-6 text-center">
            <div className="font-mono text-xs tracking-mono uppercase text-amber-400 mb-3">— Welcome to Arix</div>
            <h1 className="font-display text-4xl tracking-tighter mb-3">Your AI developer workspace</h1>
            <p className="text-zinc-400 max-w-md mb-8">Start a conversation, upload a project, or explore templates. Arix is ready to code with you.</p>
            <div className="flex gap-3">
              <button onClick={newChat} data-testid="welcome-new-chat-button" className="bg-amber-500 text-black px-5 py-3 font-mono text-xs tracking-mono uppercase hover:bg-amber-400 transition">
                Start a chat
              </button>
              <Link to="/dashboard/projects" data-testid="welcome-projects-link" className="border border-white/15 px-5 py-3 font-mono text-xs tracking-mono uppercase hover:border-amber-500 hover:text-amber-400 transition">
                Open a project
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
