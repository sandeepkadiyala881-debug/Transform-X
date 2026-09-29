import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { QUICK_START_OPTIONS } from '@/data/transformations';
import { SOURCE_KIND_META } from '@/components/common';
import { Card, CardHeader } from '@/components/ui';
import { cx } from '@/utils';

export function QuickStart() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader title="Start with a source" subtitle="Jump straight into a new transformation." />
      <ul role="list" className="grid grid-cols-1 gap-2 px-5 pb-5 sm:grid-cols-2 xl:grid-cols-1">
        {QUICK_START_OPTIONS.map((opt) => {
          const { icon: Icon } = SOURCE_KIND_META[opt.kind];
          return (
            <li key={opt.kind}>
              <button
                type="button"
                onClick={() => navigate('/transform')}
                className={cx(
                  'group flex w-full items-center gap-3 rounded-lg border border-ink-700/60 bg-ink-800/40 px-3.5 py-3 text-left transition-all',
                  'hover:border-accent-500/40 hover:bg-ink-750/70 focus-visible:ring-2 focus-visible:ring-accent-400/60',
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-accent-400 transition-colors group-hover:border-accent-500/30">
                  <Icon aria-hidden className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-100">{opt.label}</span>
                  <span className="block truncate text-[11px] text-slate-400">{opt.hint}</span>
                </span>
                <ArrowRight
                  aria-hidden
                  className="h-4 w-4 shrink-0 text-slate-600 transition-all group-hover:translate-x-0.5 group-hover:text-accent-300"
                />
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
