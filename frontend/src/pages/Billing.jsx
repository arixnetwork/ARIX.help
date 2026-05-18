import { CheckCircle, CreditCard } from "@phosphor-icons/react";

const tiers = [
  { name: "Free", price: "$0", period: "forever", features: ["50 AI requests / day", "3 active projects", "Live previews", "Community templates"] },
  { name: "Pro", price: "$24", period: "/ month", features: ["Unlimited AI requests", "Unlimited projects", "Priority runtimes", "GitHub import", "1-click deploys"], highlight: true },
  { name: "Enterprise", price: "Talk", period: "to us", features: ["SOC2 isolation", "Dedicated runtimes", "SSO + RBAC", "Audit logs & SLAs", "Custom quotas"] },
];

export default function Billing() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-white/5 bg-[#080808] px-8 py-6">
        <div className="font-mono text-xs tracking-mono uppercase text-amber-400 mb-1">— Billing</div>
        <h1 className="font-display text-3xl tracking-tighter">Plan & usage</h1>
      </div>
      <div className="p-8 space-y-12">
        {/* current usage */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.05]">
          {[
            {label:"Current plan", val:"Free", sub:"Upgrade anytime"},
            {label:"AI requests today", val:"12 / 50", sub:"Resets at midnight UTC"},
            {label:"Active projects", val:"2 / 3", sub:"On the Free tier"},
          ].map((m) => (
            <div key={m.label} className="bg-[#080808] p-6">
              <div className="font-mono text-[10px] tracking-mono uppercase text-zinc-500 mb-2">{m.label}</div>
              <div className="font-display text-3xl tracking-tighter">{m.val}</div>
              <div className="text-xs text-zinc-500 mt-1">{m.sub}</div>
            </div>
          ))}
        </div>

        {/* plans */}
        <div>
          <div className="font-mono text-xs tracking-mono uppercase text-zinc-500 mb-4">Choose a plan</div>
          <div className="grid lg:grid-cols-3 gap-6">
            {tiers.map(t => (
              <div key={t.name} className={`border ${t.highlight ? "border-amber-500" : "border-white/10"} bg-[#0a0a0a] p-6 flex flex-col`} data-testid={`billing-tier-${t.name.toLowerCase()}`}>
                <div className="font-mono text-xs tracking-mono uppercase text-zinc-400">{t.name}</div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-display text-4xl tracking-tighter">{t.price}</span>
                  <span className="text-zinc-500 text-sm">{t.period}</span>
                </div>
                <ul className="mt-5 space-y-2 flex-1">
                  {t.features.map(f => (
                    <li key={f} className="flex gap-2 text-sm text-zinc-300">
                      <CheckCircle weight="fill" className="text-amber-500 flex-shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <button data-testid={`billing-cta-${t.name.toLowerCase()}`}
                  className={`mt-6 font-mono text-xs tracking-mono uppercase py-2.5 transition ${t.highlight ? "bg-amber-500 text-black hover:bg-amber-400" : "border border-white/15 hover:border-amber-500 hover:text-amber-400"}`}>
                  {t.name === "Free" ? "Current plan" : t.name === "Enterprise" ? "Contact sales" : "Upgrade"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* invoices */}
        <div>
          <div className="font-mono text-xs tracking-mono uppercase text-zinc-500 mb-4">Recent invoices</div>
          <div className="border border-white/10 p-8 text-center text-zinc-500" data-testid="billing-invoices-empty">
            <CreditCard weight="duotone" size={32} className="mx-auto mb-2 text-zinc-700" />
            No invoices yet — you're on the Free tier.
          </div>
        </div>
      </div>
    </div>
  );
}
