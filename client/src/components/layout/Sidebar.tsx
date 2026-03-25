import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Zap,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Conversations', href: '/conversations', icon: MessageSquare },
  { label: 'Templates', href: '/templates', icon: FileText },
  { label: 'Automations', href: '/automations', icon: Zap },
  { label: 'Customers', href: '/customers', icon: Users },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const location = useLocation();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-primary-foreground font-bold text-base">Q</span>
        </div>
        <div>
          <p className="font-semibold text-foreground leading-none">Qwertees</p>
          <p className="text-xs text-muted-foreground mt-0.5">WhatsApp Automation</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? location.pathname === '/dashboard'
              : location.pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-muted/50">
          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-primary text-xs font-semibold">A</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Akshay</p>
            <p className="text-xs text-muted-foreground truncate">Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
}
