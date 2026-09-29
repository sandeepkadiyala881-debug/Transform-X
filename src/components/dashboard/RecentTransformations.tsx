import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, FileOutput } from 'lucide-react';
import { MOCK_TRANSFORMATIONS } from '@/data/transformations';
import { OUTPUT_LABELS } from '@/services';
import { SOURCE_KIND_META } from '@/components/common';
import { StatusBadge } from '@/components/common';
import { Card, CardHeader, Button, Badge } from '@/components/ui';
import { timeAgo } from '@/utils';

export function RecentTransformations() {
  const navigate = useNavigate();
  const recent = MOCK_TRANSFORMATIONS.filter((t) => t.status !== 'processing' && t.status !== 'failed').slice(0, 3);

  return (
    <Card>
      <CardHeader
        title="Recent Transformations"
        subtitle="Latest completed runs across your workspace."
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate('/history')} rightIcon={<ArrowUpRight aria-hidden className="h-3.5 w-3.5" />}>
            View all
          </Button>
        }
      />

      <ul role="list" className="divide-y divide-ink-700/50">
        {recent.map((t) => {
          const { icon: KindIcon } = SOURCE_KIND_META[t.sourceKind];
          return (
            <li key={t.id} className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-ink-800/50">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-accent-400">
                <KindIcon aria-hidden className="h-4.5 w-4.5 h-[18px] w-[18px]" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-100">{t.title}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400">
                  <span>{SOURCE_KIND_META[t.sourceKind].label}</span>
                  <span aria-hidden>·</span>
                  <span>{timeAgo(t.createdAt)}</span>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1">
                    <FileOutput aria-hidden className="h-3 w-3" />
                    {t.outputKinds.map((k) => OUTPUT_LABELS[k]).join(' · ')}
                  </span>
                </p>
              </div>

              <StatusBadge status={t.status} className="hidden sm:inline-flex" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/outputs')}
                aria-label={`Open outputs for ${t.title}`}
              >
                Open
              </Button>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-ink-700/50 px-5 py-3">
        <Badge tone="neutral">Demo data</Badge>{' '}
        <span className="text-[11px] text-slate-500">Recent runs shown are sample workspace data.</span>
      </div>
    </Card>
  );
}
