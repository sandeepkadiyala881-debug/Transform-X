import { cx } from '@/utils';

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-accent-500/30 bg-gradient-to-b from-ink-750 to-ink-900">
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" width="18" height="18" aria-hidden>
          <path
            d="M6 7h12M12 7v10M12 17l-3.5-3.5M12 17l3.5-3.5"
            stroke="currentColor"
            className="text-accent-400"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-accent-400/80 animate-pulse-soft" aria-hidden />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-sm font-bold tracking-[0.18em] text-slate-100">TRANSFORM-X</span>
          <span className="mt-1 text-[10px] font-medium tracking-[0.14em] text-slate-500">FROM INFORMATION TO ACTION</span>
        </span>
      )}
    </span>
  );
}
