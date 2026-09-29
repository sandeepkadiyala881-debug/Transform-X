import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, History as HistoryIcon, Sparkles, Download } from 'lucide-react';
import type { SourceKind, OutputKind, TransformationStatus, Transformation } from '@/types';
import { MOCK_TRANSFORMATIONS } from '@/data/transformations';
import { OUTPUT_LABELS } from '@/services';
import { SOURCE_KIND_META, StatusBadge } from '@/components/common';
import { Card, Button, Badge, Select, EmptyState } from '@/components/ui';
import { formatDateTime } from '@/utils';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'processing', label: 'Processing' },
  { value: 'failed', label: 'Failed' },
  { value: 'draft', label: 'Draft' },
];

const SOURCE_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All source types' },
  { value: 'text', label: 'Text' },
  { value: 'document', label: 'Document' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'url', label: 'Article / URL' },
];

const OUTPUT_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All output types' },
  ...Object.entries(OUTPUT_LABELS).map(([value, label]) => ({ value, label })),
];

export function History() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [outputFilter, setOutputFilter] = useState('all');

  const rows = useMemo(() => {
    return MOCK_TRANSFORMATIONS.filter((t) => {
      if (query && !t.title.toLowerCase().includes(query.toLowerCase()) && !t.id.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }
      if (statusFilter !== 'all' && t.status !== (statusFilter as TransformationStatus)) return false;
      if (sourceFilter !== 'all' && t.sourceKind !== (sourceFilter as SourceKind)) return false;
      if (outputFilter !== 'all' && !t.outputKinds.includes(outputFilter as OutputKind)) return false;
      return true;
    });
  }, [query, statusFilter, sourceFilter, outputFilter]);

  const filtersActive = query || statusFilter !== 'all' || sourceFilter !== 'all' || outputFilter !== 'all';

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative w-full lg:max-w-xs">
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or ID…"
              aria-label="Search transformations"
              className="h-9 w-full rounded-lg border border-ink-600 bg-ink-800/80 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-accent-500/50 focus:outline-none focus:ring-1 focus:ring-accent-500/30"
            />
          </div>

          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
            <Select options={SOURCE_FILTER_OPTIONS} value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} aria-label="Filter by source type" />
            <Select options={OUTPUT_FILTER_OPTIONS} value={outputFilter} onChange={(e) => setOutputFilter(e.target.value)} aria-label="Filter by output type" />
            <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status" />
          </div>

          {filtersActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('');
                setStatusFilter('all');
                setSourceFilter('all');
                setOutputFilter('all');
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        {rows.length === 0 ? (
          <EmptyState
            icon={<SlidersHorizontal aria-hidden className="h-6 w-6" />}
            title="No transformations match"
            description={filtersActive ? 'Adjust or reset the filters to see more results.' : 'Run your first transformation to populate history.'}
            action={
              filtersActive ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery('');
                    setStatusFilter('all');
                    setSourceFilter('all');
                    setOutputFilter('all');
                  }}
                >
                  Reset filters
                </Button>
              ) : (
                <Button variant="primary" onClick={() => navigate('/transform')} leftIcon={<Sparkles aria-hidden className="h-4 w-4" />}>
                  New Transformation
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">Transformation history</caption>
              <thead>
                <tr className="border-b border-ink-700/60 text-[11px] uppercase tracking-[0.1em] text-slate-500">
                  <th scope="col" className="px-5 py-3 font-semibold">Source</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Type</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Outputs</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Created</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700/40">
                {rows.map((t) => (
                  <HistoryRow key={t.id} t={t} onOpen={() => navigate('/outputs')} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="flex items-center gap-2 text-[11px] text-slate-500">
        <HistoryIcon aria-hidden className="h-3.5 w-3.5" />
        Showing {rows.length} of {MOCK_TRANSFORMATIONS.length} sample transformations · demo data.
      </p>
    </div>
  );
}

function HistoryRow({ t, onOpen }: { t: Transformation; onOpen: () => void }) {
  const { icon: KindIcon, label: kindLabel } = SOURCE_KIND_META[t.sourceKind];
  return (
    <tr className="group transition-colors hover:bg-ink-800/40">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-accent-400">
            <KindIcon aria-hidden className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-100">{t.title}</p>
            <p className="font-mono text-[10px] text-slate-500">{t.id}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 text-slate-300">{kindLabel}</td>
      <td className="px-4 py-3.5">
        <div className="flex max-w-[220px] flex-wrap gap-1">
          {t.outputKinds.map((k) => (
            <Badge key={k} tone="neutral">{OUTPUT_LABELS[k]}</Badge>
          ))}
        </div>
      </td>
      <td className="px-4 py-3.5 text-xs text-slate-400">{formatDateTime(t.createdAt)}</td>
      <td className="px-4 py-3.5">
        <StatusBadge status={t.status} />
      </td>
      <td className="px-4 py-3.5 text-right">
        <Button variant="ghost" size="sm" onClick={onOpen}>
          <Download aria-hidden className="h-3.5 w-3.5" />
          Open
        </Button>
      </td>
    </tr>
  );
}
