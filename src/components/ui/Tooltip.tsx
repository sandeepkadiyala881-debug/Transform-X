import type { ReactNode } from 'react';
import { cx } from '@/utils';

interface TooltipProps {
  label: string;
  children: ReactNode;
  side?: 'top' | 'bottom';
}

/** CSS-only tooltip; keeps dependencies out while meeting a11y needs. */
export function Tooltip({ label, children, side = 'top' }: TooltipProps) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cx(
          'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md border border-ink-500 bg-ink-800 px-2 py-1 text-xs text-slate-200 opacity-0 shadow-panel transition-opacity duration-150 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100',
          side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
        )}
      >
        {label}
      </span>
    </span>
  );
}
