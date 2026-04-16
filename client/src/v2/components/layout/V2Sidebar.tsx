import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  GitBranch,
  MessageSquare,
  FileText,
  LogOut,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: React.ElementType;
  to: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/v2/dashboard" },
  { label: "Automations", icon: GitBranch, to: "/v2/automations" },
  { label: "Live Chat", icon: MessageSquare, to: "/v2/conversations" },
  { label: "Templates", icon: FileText, to: "/v2/templates" },
];

export function V2Sidebar(): React.ReactElement {
  return (
    <aside className="bg-stitch-sidebar h-screen w-64 flex-shrink-0 flex flex-col py-6 z-30">
      {/* Logo */}
      <div className="px-6 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-stitch-primary-container rounded flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-stitch-on-primary-container fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-none">
              Qwertees
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-widest font-medium">
              WhatsApp Automation
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2">
        {NAV_ITEMS.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150 active:scale-95",
                isActive
                  ? "bg-stitch-primary-container text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/10",
              )
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 mt-auto">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/10 transition-colors rounded-lg text-sm font-medium active:scale-95 duration-150">
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
