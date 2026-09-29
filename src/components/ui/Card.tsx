import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

/** Standard panel surface — restrained border, subtle elevation on hover. */
export function Card({ interactive, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cx(
        'rounded-xl border border-ink-600/60 bg-ink-850/80 shadow-panel',
        interactive &&
          'transition-all duration-200 hover:border-ink-500/70 hover:shadow-panel-hover hover:-translate-y-0.5 cursor-pointer',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, actions, className }: CardHeaderProps) {
  return (
    <div className={cx('flex items-start justify-between gap-4 px-5 pt-4 pb-3', className)}>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold tracking-wide text-slate-100">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
