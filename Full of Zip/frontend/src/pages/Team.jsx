import { UsersThree, Plus, Crown } from "@phosphor-icons/react";
import { useAuth } from "../contexts/AuthContext";

const MOCK = [
  { name: "You", email: "", role: "Owner", crown: true },
  { name: "Invite teammates", email: "Pro plan required", role: "—", invite: true },
];

export default function Team() {
  const { user } = useAuth();
  const members = [{ name: user?.name || "You", email: user?.email, role: "Owner", crown: true }];
  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-white/5 bg-[#080808] px-8 py-6 flex justify-between items-center">
        <div>
          <div className="font-mono text-xs tracking-mono uppercase text-amber-400 mb-1">— Team</div>
          <h1 className="font-display text-3xl tracking-tighter">Members & roles</h1>
        </div>
        <button data-testid="team-invite-button"
          className="bg-amber-500 text-black px-4 py-2.5 font-mono text-xs tracking-mono uppercase hover:bg-amber-400 transition flex items-center gap-2">
          <Plus weight="bold" /> Invite
        </button>
      </div>
      <div className="p-8 space-y-px bg-white/[0.05]">
        {members.map((m, i) => (
          <div key={i} className="bg-[#080808] p-5 flex items-center gap-4" data-testid={`team-member-${i}`}>
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 grid place-items-center">
              <UsersThree weight="duotone" className="text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="font-display text-lg flex items-center gap-2">{m.name} {m.crown && <Crown weight="fill" className="text-amber-500" size={14} />}</div>
              <div className="font-mono text-[10px] tracking-mono uppercase text-zinc-500">{m.email}</div>
            </div>
            <div className="font-mono text-[10px] tracking-mono uppercase border border-white/10 px-2 py-1 text-amber-400">{m.role}</div>
          </div>
        ))}
        <div className="bg-[#080808] p-8 text-center text-zinc-500" data-testid="team-upsell">
          <div className="font-display text-xl mb-2 tracking-tight">Collaborate in real-time</div>
          <p className="text-zinc-400 max-w-md mx-auto">Upgrade to Pro to invite teammates, share workspaces, and edit code together.</p>
        </div>
      </div>
    </div>
  );
}
