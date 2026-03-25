import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 flex-shrink-0 flex-col border-r border-border bg-card">
          <Sidebar />
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile header */}
          <header className="flex md:hidden items-center gap-3 px-4 py-3 border-b border-border bg-card">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <Sidebar onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">Q</span>
              </div>
              <span className="font-semibold text-foreground">Qwertees</span>
            </div>
          </header>

          {/* Page content */}
          <main className={cn('flex-1 overflow-auto')}>{children}</main>
        </div>

        <Toaster />
      </div>
    </TooltipProvider>
  );
}
