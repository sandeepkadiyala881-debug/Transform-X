import { BrainCircuit, Building2, Server, UserX, ShieldCheck } from 'lucide-react';
import type { SourceAnalysis } from '@/types';
import { Card, Badge } from '@/components/ui';

interface SourceIntelligencePanelProps {
  analysis: SourceAnalysis | null;
  analyzing: boolean;
}

/**
 * Presentational panel for Source Intelligence. Phase 1 feeds it mock analysis;
 * later the same props carry real backend output.
 */
export function SourceIntelligencePanel({ analysis, analyzing }: SourceIntelligencePanelProps) {
  return (
    <Card className="h-fit">
      <div className="flex items-center justify-between px-5 pt-4 pb-1">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <BrainCircuit aria-hidden className="h-4 w-4 text-accent-400" />
          Source Intelligence
        </h3>
        {analysis && !analyzing && <Badge tone="accent">Analyzed</Badge>}
      </div>

      {analyzing ? (
        <div className="space-y-3 px-5 pb-5 pt-3" aria-busy="true" aria-label="Analyzing source">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-4 w-full" style={{ width: `${90 - i * 9}%` }} />
          ))}
          <p className="pt-1 text-[11px] text-slate-500">Understanding source content…</p>
        </div>
      ) : !analysis ? (
        <div className="px-5 pb-5 pt-2">
          <p className="rounded-lg border border-dashed border-ink-600 bg-ink-900/40 px-4 py-6 text-center text-xs leading-5 text-slate-500">
            Provide a source to see content type, language, topics and detected entities.
          </p>
        </div>
      ) : (
        <div className="space-y-4 px-5 pb-5 pt-2 animate-fade-up">
          <dl className="grid grid-cols-2 gap-3">
            <Fact label="Content Type" value={analysis.contentType} />
            <Fact label="Language" value={analysis.language} />
            <Fact label="Estimated Length" value={cap(analysis.estimatedLength)} />
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Confidence</dt>
              <dd className="mt-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-300"
                      style={{ width: `${analysis.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-accent-300">{analysis.confidence}%</span>
                </div>
              </dd>
            </div>
          </dl>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Key Topics</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {analysis.keyTopics.map((topic) => (
                <li key={topic}>
                  <Badge tone="accent">{topic}</Badge>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Detected Entities</p>
            <div className="mt-2 space-y-2 text-xs">
              <EntityRow icon={Building2} label="Organizations" values={analysis.entities.organizations} />
              <EntityRow icon={Server} label="Systems" values={analysis.entities.systems} />
              {analysis.entities.threatActors?.length ? (
                <EntityRow icon={UserX} label="Threat Actors" values={analysis.entities.threatActors} />
              ) : null}
            </div>
          </div>

          <p className="flex items-start gap-1.5 border-t border-ink-700/50 pt-3 text-[10px] leading-4 text-slate-500">
            <ShieldCheck aria-hidden className="mt-0.5 h-3 w-3 shrink-0" />
            Mock analysis for Phase 1 — structure ready for live backend intelligence.
          </p>
        </div>
      )}
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink-700/60 bg-ink-900/50 px-3 py-2.5">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</dt>
      <dd className="mt-0.5 truncate text-xs font-semibold text-slate-100" title={value}>
        {value}
      </dd>
    </div>
  );
}

function EntityRow({
  icon: Icon,
  label,
  values,
}: {
  icon: typeof Building2;
  label: string;
  values: string[];
}) {
  if (!values.length) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
      <p className="text-slate-300">
        <span className="text-slate-500">{label}: </span>
        {values.join(', ')}
      </p>
    </div>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
