import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  PackageOpen,
  History,
  BarChart3,
  FolderKanban,
  Settings,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Logo } from './Logo';
import { cx } from '@/utils';

interface NavEntry {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const MAIN_NAV: NavEntry[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transform', label: 'New Transformation', icon: Sparkles, end: true },
  { to: '/outputs', label: 'Outputs', icon: PackageOpen, end: true },
  { to: '/history', label: 'History', icon: History, end: true },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, end: true },
];

const WORKSPACE_NAV: NavEntry[] = [
  { to: '/workspace', label: 'Workspace', icon: FolderKanban, end: true },
  { to: '/settings', label: 'Settings', icon: Settings, end: true },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center border-b border-ink-700/60 px-5">
        <NavLink to="/dashboard" className="rounded-md" onClick={onNavigate}>
          <Logo />
        </NavLink>
      </div>

      {/* Navigation groups */}
      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {MAIN_NAV.map((entry) => (
            <li key={entry.to}>
              <NavLink
                to={entry.to}
                end={entry.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cx(
                    'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent-500/10 text-accent-300 ring-1 ring-inset ring-accent-500/25'
                      : 'text-slate-400 hover:bg-ink-750/70 hover:text-slate-100',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <entry.icon aria-hidden className={cx('h-[18px] w-[18px]', isActive ? 'text-accent-400' : 'text-slate-500 group-hover:text-slate-300')} />
                    <span>{entry.label}</span>
                    {entry.label === 'New Transformation' && (
                      <span className="ml-auto rounded border border-accent-500/30 bg-accent-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent-300">N</span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mx-3 my-4 border-t border-ink-700/60" aria-hidden />

        <ul className="space-y-1">
          {WORKSPACE_NAV.map((entry) => (
            <li key={entry.to}>
              <NavLink
                to={entry.to}
                end={entry.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cx(
                    'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent-500/10 text-accent-300 ring-1 ring-inset ring-accent-500/25'
                      : 'text-slate-400 hover:bg-ink-750/70 hover:text-slate-100',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <entry.icon aria-hidden className={cx('h-[18px] w-[18px]', isActive ? 'text-accent-400' : 'text-slate-500 group-hover:text-slate-300')} />
                    <span>{entry.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* System status footer */}
      <div className="shrink-0 border-t border-ink-700/60 px-5 py-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/60 animate-ping" aria-hidden />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
          </span>
          <span className="font-medium text-emerald-300">System Operational</span>
        </div>
        <p className="mt-2 text-[11px] leading-4 text-slate-500">
          SIH 2026 · PS 26154
          <br />
          Operator · Standard Workspace
        </p>
      </div>
    </div>
  );
}

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 shrink-0 border-r border-ink-700/60 bg-ink-900/70 backdrop-blur-md lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onCloseMobile}
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-ink-700/60 bg-ink-900 shadow-panel-hover animate-fade-up">
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation"
              className="absolute right-3 top-4 rounded-md p-1.5 text-slate-400 hover:bg-ink-750 hover:text-slate-100"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
            <SidebarContent onNavigate={onCloseMobile} />
          </div>
          <X className="hidden" aria-hidden />
        </div>
      )}
    </>
  );
}
