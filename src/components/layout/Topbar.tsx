import { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, Check } from 'lucide-react';
import type { Notification } from '@/types';
import { MOCK_NOTIFICATIONS } from '@/data/transformations';
import { Tooltip } from '@/components/ui';
import { cx } from '@/utils';

interface TopbarProps {
  title: string;
  onOpenMobileNav: () => void;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

export function Topbar({ title, onOpenMobileNav, onSearch, searchPlaceholder = 'Search transformations…' }: TopbarProps) {
  const [query, setQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const notifRef = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => n.unread).length;

  // Close the notifications popover on outside click.
  useEffect(() => {
    if (!notifOpen) return;
    function onDocClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [notifOpen]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ink-700/60 bg-ink-900/70 px-4 backdrop-blur-md lg:px-6">
      {/* Mobile menu */}
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation menu"
        className="rounded-lg p-2 text-slate-300 hover:bg-ink-750 hover:text-white lg:hidden"
      >
        <Menu aria-hidden className="h-5 w-5" />
      </button>

      {/* Page title */}
      <h1 className="truncate text-base font-semibold text-slate-100">{title}</h1>

      {/* Global search */}
      <div className="ml-auto hidden min-w-0 flex-1 max-w-md items-center md:flex">
        <div className="relative w-full">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onSearch?.(e.target.value);
            }}
            placeholder={searchPlaceholder}
            aria-label="Search transformations"
            className={cx(
              'h-9 w-full rounded-lg border border-ink-600 bg-ink-800/80 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500',
              'transition-colors focus:border-accent-500/50 focus:outline-none focus:ring-1 focus:ring-accent-500/30',
            )}
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1.5 md:ml-0">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <Tooltip label="Notifications">
            <button
              type="button"
              onClick={() => setNotifOpen((o) => !o)}
              aria-haspopup="dialog"
              aria-expanded={notifOpen}
              aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
              className="relative rounded-lg p-2 text-slate-300 transition-colors hover:bg-ink-750 hover:text-white"
            >
              <Bell aria-hidden className="h-4.5 w-4.5 h-[18px] w-[18px]" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-accent-400 ring-2 ring-ink-900" aria-hidden />
              )}
            </button>
          </Tooltip>

          {notifOpen && (
            <div
              role="dialog"
              aria-label="Notifications"
              className="absolute right-0 top-full mt-2 w-[min(88vw,340px)] overflow-hidden rounded-xl border border-ink-600 bg-ink-850 shadow-panel-hover animate-scale-in"
            >
              <div className="flex items-center justify-between border-b border-ink-700/60 px-4 py-2.5">
                <span className="text-xs font-semibold text-slate-200">Notifications</span>
                <button
                  type="button"
                  onClick={() => setNotifications((ns) => ns.map((n) => ({ ...n, unread: false })))}
                  className="flex items-center gap-1 text-[11px] text-accent-300 transition-colors hover:text-accent-200"
                >
                  <Check aria-hidden className="h-3 w-3" /> Mark all read
                </button>
              </div>
              <ul className="max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={cx('border-b border-ink-700/40 px-4 py-3 last:border-0', n.unread && 'bg-accent-500/5')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-100">{n.title}</p>
                      <span className="shrink-0 text-[10px] text-slate-500">{n.time}</span>
                    </div>
                    <p className="mt-0.5 text-xs leading-5 text-slate-400">{n.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Operator profile */}
        <Tooltip label="Operator">
          <button
            type="button"
            aria-label="Operator profile"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-500 bg-gradient-to-b from-ink-700 to-ink-800 text-xs font-bold text-accent-300 transition-colors hover:border-accent-500/40"
          >
            O
          </button>
        </Tooltip>
      </div>
    </header>
  );
}
