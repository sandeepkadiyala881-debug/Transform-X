import { Check } from 'lucide-react';
import { cx } from '@/utils';

export type WorkflowStep = 'source' | 'configure' | 'generate';

const STEPS: { id: WorkflowStep; num: string; label: string }[] = [
  { id: 'source', num: '01', label: 'SOURCE' },
  { id: 'configure', num: '02', label: 'CONFIGURE' },
  { id: 'generate', num: '03', label: 'GENERATE' },
];

interface WorkflowStepperProps {
  current: WorkflowStep;
  onStepClick?: (step: WorkflowStep) => void;
}

export function WorkflowStepper({ current, onStepClick }: WorkflowStepperProps) {
  const activeIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <ol aria-label="Workflow progress" className="flex items-center gap-2 sm:gap-4">
      {STEPS.map((step, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        const clickable = (done || (active === false && i < activeIndex)) && Boolean(onStepClick);
        return (
          <li key={step.id} className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick?.(step.id)}
              className={cx(
                'flex items-center gap-2.5 rounded-lg px-1 py-1',
                clickable ? 'cursor-pointer' : 'cursor-default',
              )}
              aria-current={active ? 'step' : undefined}
            >
              <span
                className={cx(
                  'flex h-8 w-8 items-center justify-center rounded-lg border font-mono text-xs font-semibold transition-colors',
                  done && 'border-accent-500/40 bg-accent-500/15 text-accent-300',
                  active && 'border-accent-500/60 bg-accent-500/20 text-accent-200 shadow-glow',
                  !done && !active && 'border-ink-600 bg-ink-800 text-slate-500',
                )}
              >
                {done ? <Check aria-hidden className="h-4 w-4" /> : step.num}
              </span>
              <span
                className={cx(
                  'hidden text-xs font-bold tracking-[0.12em] sm:block',
                  active ? 'text-slate-100' : done ? 'text-slate-300' : 'text-slate-500',
                )}
              >
                {step.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className={cx('h-px w-6 sm:w-10', done ? 'bg-accent-500/40' : 'bg-ink-600')}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
