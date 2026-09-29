import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transform': 'New Transformation',
  '/outputs': 'Generated Outputs',
  '/history': 'History',
  '/analytics': 'Analytics',
  '/workspace': 'Workspace',
  '/settings': 'Settings',
};

export function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  const title =
    PAGE_TITLES[location.pathname] ??
    (location.pathname.startsWith('/outputs/') ? 'Output Preview' : 'TRANSFORM-X');

  return (
    <div className="min-h-screen bg-ink-950 bg-grid-faint bg-[length:44px_44px]">
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />

      <div className="lg:pl-64">
        <Topbar
          title={title}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          searchPlaceholder={`Search ${title.toLowerCase()}…`}
        />
        <main id="main" className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
