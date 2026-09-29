import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cx } from '@/utils';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
}

export function Select({ label, options, className, id, ...rest }: SelectProps) {
  const selectId = id ?? (label ? `select-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined);
  return (
    <div className={cx('w-full', className)}>
      {label ? (
        <label htmlFor={selectId} className="mb-1.5 block text-xs font-medium text-slate-400">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          id={selectId}
          className={cx(
            'h-10 w-full appearance-none rounded-lg border border-ink-600 bg-ink-750 px-3 pr-9 text-sm text-slate-200',
            'transition-colors hover:border-ink-500 focus:border-accent-500/60 focus:outline-none focus:ring-1 focus:ring-accent-500/40',
          )}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-ink-850 text-slate-200">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
        />
      </div>
    </div>
  );
}
