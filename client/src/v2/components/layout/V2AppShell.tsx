import { Outlet } from 'react-router-dom';
import { V2Sidebar } from './V2Sidebar';

/**
 * V2AppShell — root layout for all /v2/* routes.
 *
 * The `theme-v2` class on the outer div scopes the v2 CSS variable
 * overrides defined in v2-theme.css, isolating the new design system
 * from the existing v1 shadcn/ui tokens.
 */
export function V2AppShell(): React.ReactElement {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-stitch-surface text-stitch-on-surface font-sans antialiased">
      <V2Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
