import { Check, Layers3 } from 'lucide-react';
import type { OutputKind } from '@/types';
import { OUTPUT_CATALOG } from '@/data/outputs';
import { OUTPUT_ICON } from './outputIcons';
import { Button } from '@/components/ui';
import { cx } from '@/utils';

interface OutputSelectorProps {
  selected: OutputKind[];
  onChange: (next: OutputKind[]) => void;
}

export function OutputSelector({ selected, onChange }: OutputSelectorProps) {
  const allSelected = selected.length === OUTPUT_CATALOG.length;

  function toggle(kind: OutputKind) {
    onChange(selected.includes(kind) ? selected.filter((k) => k !== kind) : [...selected, kind]);
  }

  return (
    <section aria-labelledby="output-selection-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id="output-selection-heading" className="text-base font-semibold text-slate-100">
            What do you want to create?
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">Select one or more deliverables from the same source.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onChange(OUTPUT_CATALOG.map((o) => o.kind))}
            disabled={allSelected}
          >
            Select All
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onChange([])} disabled={selected.length === 0}>
            Clear All
          </Button>
        </div>
      </div>

      <div
        role="group"
        aria-label="Deliverable selection"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {OUTPUT_CATALOG.map((out) => {
          const isSelected = selected.includes(out.kind);
          const Icon = OUTPUT_ICON[out.kind];
          return (
            <button
              key={out.kind}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              onClick={() => toggle(out.kind)}
              className={cx(
                'group relative flex flex-col rounded-xl border p-4 text-left transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950',
                isSelected
                  ? 'border-accent-500/60 bg-accent-500/10 shadow-glow'
                  : 'border-ink-600/60 bg-ink-850/80 hover:border-ink-500/80 hover:bg-ink-800/80 hover:-translate-y-0.5',
              )}
            >
              <span
                aria-hidden
                className={cx(
                  'absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-md border transition-colors',
                  isSelected ? 'border-accent-400 bg-accent-400 text-ink-950' : 'border-ink-500 bg-ink-800 text-transparent',
                )}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>

              <span
                className={cx(
                  'flex h-10 w-10 items-center justify-center rounded-lg border transition-colors',
                  isSelected ? 'border-accent-500/40 bg-ink-900 text-accent-300' : 'border-ink-600 bg-ink-800 text-slate-400 group-hover:text-slate-200',
                )}
              >
                <Icon aria-hidden className="h-4.5 w-4.5 h-[18px] w-[18px]" />
              </span>

              <span className="mt-3 pr-6 text-sm font-bold tracking-wide text-slate-100">{out.name}</span>
              <span className="mt-1 text-[11px] leading-5 text-slate-400">{out.tagline}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
        <Layers3 aria-hidden className="h-3.5 w-3.5" />
        {selected.length} of {OUTPUT_CATALOG.length} deliverable types selected — every output is generated from the same source.
      </p>
    </section>
  );
}
