import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PackageOpen, ArrowRight, Sparkles, Clock3 } from 'lucide-react';
import type { GeneratedOutput } from '@/types';
import { OUTPUT_LABELS } from '@/services';
import { OUTPUT_ICON } from '@/components/transformation/outputIcons';
import { StatusBadge } from '@/components/common';
import { Card, Button, EmptyState } from '@/components/ui';
import { timeAgo } from '@/utils';
import { MockOutputStore } from '@/services/outputStore';
import { useEffect, useState } from 'react';

/** Location state passed from the Transform flow; deep links resolve via the store. */
interface OutputsLocationState {
  outputs?: GeneratedOutput[];
  transformationTitle?: string;
  transformationId?: string;
}

export function Outputs() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? {}) as OutputsLocationState;

  const [storeOutputs, setStoreOutputs] = useState<GeneratedOutput[]>([]);

  useEffect(() => {
    const unsub = MockOutputStore.subscribe(setStoreOutputs);
    return () => {
      unsub();
    };
  }, []);

  const outputs = state.outputs ?? storeOutputs;
  const transformationTitle = state.transformationTitle ?? outputs[0]?.name ?? '';

  const summary = useMemo(
    () => ({ sources: 1, deliverables: outputs.length }),
    [outputs.length],
  );

  if (outputs.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<PackageOpen aria-hidden className="h-6 w-6" />}
          title="No outputs yet"
          description="Run a transformation to generate advisories, summaries, posts, decks and more — they will appear here."
          action={
            <Button variant="primary" onClick={() => navigate('/transform')} leftIcon={<Sparkles aria-hidden className="h-4 w-4" />}>
              New Transformation
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-50">Generated Outputs</h2>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <span className="rounded-md border border-ink-600 bg-ink-800/70 px-2 py-0.5 text-xs font-semibold text-slate-200">
              {summary.sources} Source
            </span>
            <span className="rounded-md border border-accent-500/30 bg-accent-500/10 px-2 py-0.5 text-xs font-semibold text-accent-300">
              {summary.deliverables} Deliverable{summary.deliverables === 1 ? '' : 's'}
            </span>
            <span className="text-xs">{transformationTitle}</span>
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/transform')} leftIcon={<Sparkles aria-hidden className="h-4 w-4" />}>
          New Transformation
        </Button>
      </div>

      {/* Output cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {outputs.map((out) => {
          const Icon = OUTPUT_ICON[out.kind];
          return (
            <Card key={out.id} interactive className="flex flex-col p-5 animate-fade-up">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-accent-400">
                  <Icon aria-hidden className="h-5 w-5" />
                </span>
                <StatusBadge status={out.status === 'ready' ? 'completed' : 'processing'} />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-50">{OUTPUT_LABELS[out.kind]}</h3>
              <p className="mt-1 flex-1 text-xs leading-5 text-slate-400">{out.description}</p>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
                <Clock3 aria-hidden className="h-3 w-3" />
                {timeAgo(out.createdAt)}
              </p>
              <Button
                className="mt-4 w-full"
                variant="secondary"
                onClick={() =>
                  navigate(`/outputs/${out.id}`, {
                    state: { output: out, transformationTitle },
                  })
                }
                rightIcon={<ArrowRight aria-hidden className="h-4 w-4" />}
              >
                Open
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
