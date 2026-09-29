import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Copy,
  RefreshCw,
  Download,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { GeneratedOutput } from '@/types';
import { OUTPUT_LABELS } from '@/services';
import { OUTPUT_ICON } from '@/components/transformation/outputIcons';
import { OutputBodyRenderer } from '@/components/outputs/OutputBodyRenderer';
import { MockOutputStore } from '@/services/outputStore';
import { Badge, Button, Tooltip, Toasts } from '@/components/ui';
import { useToasts } from '@/hooks/useToasts';
import { formatDateTime } from '@/utils';

interface PreviewLocationState {
  output?: GeneratedOutput;
  transformationTitle?: string;
}

export function OutputPreview() {
  const { id = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toasts, push, dismiss } = useToasts();

  const state = (location.state ?? {}) as PreviewLocationState;

  const output = state.output ?? MockOutputStore.get().find((o) => o.id === id) ?? null;

  if (!output) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/outputs')} leftIcon={<ArrowLeft aria-hidden className="h-4 w-4" />}>
          Back to Outputs
        </Button>
        <div className="rounded-xl border border-dashed border-ink-600 bg-ink-900/40 px-6 py-16 text-center">
          <p className="text-sm text-slate-400">This output could not be found. It may belong to a previous session.</p>
          <Button className="mt-4" variant="primary" onClick={() => navigate('/transform')}>
            Start a new transformation
          </Button>
        </div>
      </div>
    );
  }

  const Icon = OUTPUT_ICON[output.kind];

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(outputSummaryText(output!));
      push('success', 'Output copied to clipboard.');
    } catch {
      push('error', 'Clipboard unavailable in this context.');
    }
  }

  return (
    <div className="space-y-5">
      <Toasts toasts={toasts} onDismiss={dismiss} />

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/outputs')} leftIcon={<ArrowLeft aria-hidden className="h-4 w-4" />}>
          Outputs
        </Button>
        <span aria-hidden className="hidden h-4 w-px bg-ink-600 sm:block" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-100">
            {state.transformationTitle ? `${state.transformationTitle} · ` : ''}
            {OUTPUT_LABELS[output.kind]}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip label="Annotate this draft">
            <Button size="sm" variant="ghost" onClick={() => push('info', 'Inline editing arrives with backend persistence.')}>
              <Pencil aria-hidden className="h-3.5 w-3.5" />
              <span className="sr-only">Edit</span>
            </Button>
          </Tooltip>
          <Tooltip label="Copy content">
            <Button size="sm" variant="ghost" onClick={handleCopy}>
              <Copy aria-hidden className="h-3.5 w-3.5" />
              <span className="sr-only">Copy</span>
            </Button>
          </Tooltip>
          <Tooltip label="Regenerate from source">
            <Button size="sm" variant="ghost" onClick={() => push('info', 'Regeneration will re-run the AI pipeline in Phase 2.')}>
              <RefreshCw aria-hidden className="h-3.5 w-3.5" />
              <span className="sr-only">Regenerate</span>
            </Button>
          </Tooltip>
          <Button size="sm" variant="secondary" onClick={() => push('success', 'Export queued — file delivery lands in Phase 2.')}>
            <Download aria-hidden className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Document card */}
      <article className="rounded-2xl border border-ink-600/60 bg-ink-850/80 shadow-panel">
        {/* Document header */}
        <header className="flex flex-wrap items-center gap-3 border-b border-ink-700/60 px-5 py-4 sm:px-7">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-accent-400">
            <Icon aria-hidden className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-50">{OUTPUT_LABELS[output.kind]}</h2>
            <p className="text-[11px] text-slate-500">Generated {formatDateTime(output.createdAt)} · {output.transformationId}</p>
          </div>
          <Badge tone="success">Generated</Badge>
        </header>

        {/* Body */}
        <div className="px-5 py-6 sm:px-7">
          <OutputBodyRenderer body={output.body} />
        </div>

        {/* Document footer */}
        <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-ink-700/60 px-5 py-4 sm:px-7">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
            <Sparkles aria-hidden className="h-3 w-3" />
            AI-generated draft
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck aria-hidden className="h-3 w-3" />
            Source-grounded content
          </span>
          <span className="ml-auto text-[10px] uppercase tracking-[0.14em] text-slate-600">TRANSFORM-X</span>
        </footer>
      </article>
    </div>
  );
}

/** Flattens any output body to plain text for the copy action. */
function outputSummaryText(out: GeneratedOutput): string {
  const b = out.body;
  switch (b.kind) {
    case 'advisory':
      return [b.title, ...b.sections.map((s) => `${s.heading}\n${[...s.paragraphs, ...(s.bullets ?? [])].join('\n')}`)].join('\n\n');
    case 'summary':
      return [b.headline, ...b.keyPoints, '', 'Decisions required:', ...b.decisionsRequired].join('\n');
    case 'social':
      return `${b.text}\n\n${b.hashtags.join(' ')}`;
    case 'presentation':
      return b.slides.map((s, i) => `Slide ${i + 1}: ${s.title}\n${s.bullets.map((x) => `• ${x}`).join('\n')}`).join('\n\n');
    case 'infographic':
      return [b.headline, ...b.stats.map((s) => `${s.label}: ${s.value}`), ...b.callouts].join('\n');
    case 'video-package':
      return [b.logline, ...b.script.map((s) => `${s.timecode} — ${s.narration}`)].join('\n\n');
  }
}
