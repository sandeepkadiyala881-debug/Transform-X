import type { ReactNode } from 'react';
import { cx } from '@/utils';

type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-ink-700/60 text-slate-300 border-ink-500/50',
  accent: 'bg-accent-500/15 text-accent-300 border-accent-500/30',
  success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  danger: 'bg-red-500/15 text-red-300 border-red-500/30',
  info: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
