import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  ChatCircleText, FolderOpen, Stack, RocketLaunch, CreditCard, UsersThree, Gear, ShieldStar, SignOut
} from "@phosphor-icons/react";

const NAV = [
  { to: "/dashboard", label: "AI Chats", icon: ChatCircleText, end: true, testid: "nav-chats" },
  { to: "/dashboard/projects", label: "Projects", icon: FolderOpen, testid: "nav-projects" },
  { to: "/dashboard/templates", label: "Templates", icon: Stack, testid: "nav-templates" },
  { to: "/dashboard/deployments", label: "Deployments", icon: RocketLaunch, testid: "nav-deployments" },
  { to: "/dashboard/billing", label: "Billing", icon: CreditCard, testid: "nav-billing" },
  { to: "/dashboard/team", label: "Team", icon: UsersThree, testid: "nav-team" },
  { to: "/dashboard/settings", label: "Settings", icon: Gear, testid: "nav-settings" },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="h-screen w-screen flex bg-[#050505] text-zinc-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-white/5 flex flex-col bg-[#080808]" data-testid="dashboard-sidebar">
        <Link to="/" className="h-14 px-4 flex items-center gap-2 border-b border-white/5" data-testid="sidebar-brand">
          <div className="w-7 h-7 bg-amber-500 grid place-items-center font-display text-black text-sm">A</div>
          <span className="font-display text-base">Arix<span className="text-amber-500">.help</span></span>
        </Link>
        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}
              data-testid={item.testid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-sm font-body text-sm transition ${
                  isActive
                    ? "bg-[#141414] text-amber-400 border-l-2 border-amber-500 pl-[10px]"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-[#0e0e0e]"
                }`
              }>
              <item.icon weight="duotone" size={18} />
              {item.label}
            </NavLink>
          ))}
          {user?.role === "admin" && (
            <NavLink to="/dashboard/admin" data-testid="nav-admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-sm font-body text-sm transition ${
                  isActive ? "bg-[#141414] text-amber-400" : "text-zinc-400 hover:text-zinc-100 hover:bg-[#0e0e0e]"
                }`}>
              <ShieldStar weight="duotone" size={18} /> Admin
            </NavLink>
          )}
        </nav>
        <div className="border-t border-white/5 p-3">
          <div className="flex items-center gap-3" data-testid="sidebar-user">
            {user?.picture ? (
              <img src={user.picture} alt="" className="w-9 h-9 rounded-sm object-cover" />
            ) : (
              <div className="w-9 h-9 bg-amber-500 grid place-items-center font-display text-black text-sm rounded-sm">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{user?.name}</div>
              <div className="font-mono text-[10px] tracking-mono uppercase text-zinc-500 truncate">{user?.role}</div>
            </div>
            <button onClick={handleLogout} data-testid="logout-button" aria-label="Sign out"
              className="text-zinc-400 hover:text-amber-400 transition p-2" title="Sign out">
              <SignOut weight="bold" size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main outlet */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
