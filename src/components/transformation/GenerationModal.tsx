import { useEffect } from 'react';
import { Check, Loader2, Circle, ArrowRight, PackageCheck } from 'lucide-react';
import type { GeneratedOutput } from '@/types';
import { OUTPUT_LABELS } from '@/services';
import { OUTPUT_ICON } from './outputIcons';
import { Button } from '@/components/ui';
import { cx } from '@/utils';

export interface GenerationStageDef {
  id: string;
  label: string;
}

export const GENERATION_STAGES: GenerationStageDef[] = [
  { id: 'read', label: 'Reading source' },
  { id: 'understand', label: 'Understanding context' },
  { id: 'apply-config', label: 'Applying configuration' },
  { id: 'generate', label: 'Generating deliverables' },
  { id: 'validate', label: 'Validating outputs' },
];

interface GenerationModalProps {
  open: boolean;
  stageIndex: number;
  percent: number;
  complete: boolean;
  outputs: GeneratedOutput[];
  onViewDeliverables: () => void;
}

export function GenerationModal({
  open,
  stageIndex,
  percent,
  complete,
  outputs,
  onViewDeliverables,
}: GenerationModalProps) {
  // Lock body scroll while the modal is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-ink-950/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Transformation progress"
    >
      <div className="w-full max-w-lg rounded-2xl border border-ink-600/70 bg-ink-900 p-6 shadow-panel-hover animate-scale-in sm:p-8">
        {!complete ? (
          <>
            <div className="flex items-center gap-3">
              <Loader2 aria-hidden className="h-5 w-5 animate-spin text-accent-400" />
              <h2 className="text-lg font-bold text-slate-50">Transforming your source…</h2>
            </div>

            {/* Progress bar */}
            <div
              className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-ink-700"
              role="progressbar"
              aria-valuenow={Math.round(percent)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-600 to-accent-300 transition-all duration-500 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>

            <ol className="mt-6 space-y-3.5">
              {GENERATION_STAGES.map((stage, i) => {
                const done = i < stageIndex;
                const active = i === stageIndex;
                return (
                  <li key={stage.id} className="flex items-center gap-3">
                    {done ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/15">
                        <Check aria-hidden className="h-3.5 w-3.5 text-emerald-300" strokeWidth={3} />
                      </span>
                    ) : active ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-accent-500/50 bg-accent-500/10">
                        <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin text-accent-300" />
                      </span>
                    ) : (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-ink-600 bg-ink-850">
                        <Circle aria-hidden className="h-2 w-2 text-slate-600" />
                      </span>
                    )}
                    <span
                      className={cx(
                        'text-sm',
                        done ? 'text-slate-300' : active ? 'font-semibold text-slate-100' : 'text-slate-500',
                      )}
                    >
                      {stage.label}
                    </span>
                    {active && <span className="ml-auto font-mono text-[10px] text-accent-300/80">working…</span>}
                  </li>
                );
              })}
            </ol>
          </>
        ) : (
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10">
              <PackageCheck aria-hidden className="h-7 w-7 text-emerald-300" />
            </span>
            <h2 className="mt-4 text-xl font-bold text-slate-50">Transformation Complete</h2>
            <p className="mt-1.5 text-sm text-slate-400">
              {outputs.length} deliverable{outputs.length === 1 ? '' : 's'} generated from 1 source.
            </p>

            <ul aria-label="Generated deliverables" className="mt-5 space-y-2 text-left">
              {outputs.map((out) => {
                const Icon = OUTPUT_ICON[out.kind];
                return (
                  <li
                    key={out.id}
                    className="flex items-center gap-3 rounded-lg border border-ink-700/60 bg-ink-850/70 px-4 py-2.5"
                  >
                    <Icon aria-hidden className="h-4 w-4 shrink-0 text-accent-400" />
                    <span className="flex-1 text-sm font-medium text-slate-100">{OUTPUT_LABELS[out.kind]}</span>
                    <Check aria-hidden className="h-4 w-4 text-emerald-400" />
                  </li>
                );
              })}
            </ul>

            <Button
              variant="primary"
              size="lg"
              className="mt-6 w-full"
              onClick={onViewDeliverables}
              rightIcon={<ArrowRight aria-hidden className="h-4 w-4" />}
            >
              View Deliverables
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
