import { PIPELINE_STAGES } from '@/data/dashboard';
import { Card, CardHeader, Badge } from '@/components/ui';

/**
 * The signature TRANSFORM-X pipeline visual. Desktop: horizontal stage rail with
 * animated connection lines. Mobile: vertical stack with animated connectors.
 */
export function PipelineCard() {
  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Transformation Pipeline"
        subtitle="Every source follows the same disciplined path from raw information to delivered communication."
        actions={<Badge tone="accent">Core workflow</Badge>}
      />

      {/* Horizontal rail (md+) */}
      <div className="hidden px-5 pb-6 md:block">
        <div className="relative">
          {/* Base rail */}
          <div className="absolute left-0 right-0 top-[26px] h-px bg-ink-600" aria-hidden />
          {/* Animated sweep along the rail */}
          <div
            className="absolute left-0 right-0 top-[26px] h-px overflow-hidden"
            aria-hidden
          >
            <span className="absolute h-px w-24 bg-gradient-to-r from-transparent via-accent-400/80 to-transparent animate-indeterminate" />
          </div>

          <ol className="relative grid grid-cols-5 gap-4">
            {PIPELINE_STAGES.map((stage) => (
              <li key={stage.id} className="group">
                <div className="flex flex-col items-center text-center">
                  <span className="relative z-10 flex h-[52px] w-[52px] items-center justify-center rounded-xl border border-ink-600 bg-ink-800 shadow-panel transition-colors group-hover:border-accent-500/40">
                    <stage.icon aria-hidden className="h-5 w-5 text-accent-400" />
                  </span>
                  <p className="mt-3 font-mono text-[10px] text-slate-500">{stage.index}</p>
                  <p className="mt-1 text-xs font-bold tracking-[0.1em] text-slate-200">{stage.title}</p>
                  <p className="mt-1.5 hidden text-[11px] leading-5 text-slate-400 lg:block">{stage.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Vertical stack (< md) */}
      <div className="px-5 pb-6 md:hidden">
        <ol className="space-y-0">
          {PIPELINE_STAGES.map((stage, i) => (
            <li key={stage.id}>
              <div className="flex items-start gap-3.5">
                <div className="flex flex-col items-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink-600 bg-ink-800">
                    <stage.icon aria-hidden className="h-4.5 w-4.5 h-[18px] w-[18px] text-accent-400" />
                  </span>
                  {i < PIPELINE_STAGES.length - 1 && (
                    <span className="relative my-1 w-px flex-1 overflow-hidden bg-ink-600" style={{ minHeight: 24 }} aria-hidden>
                      <span className="absolute top-0 h-full w-px bg-gradient-to-b from-accent-400/70 to-accent-400/0 animate-flow-down" style={{ animationDelay: `${i * 0.4}s` }} />
                    </span>
                  )}
                </div>
                <div className="pb-5 pt-1.5">
                  <p className="font-mono text-[10px] text-slate-500">{stage.index}</p>
                  <p className="mt-0.5 text-xs font-bold tracking-[0.1em] text-slate-200">{stage.title}</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-400">{stage.description}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}
