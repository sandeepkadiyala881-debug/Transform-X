import { Sparkles } from 'lucide-react';
import type { Source, TransformationConfig, OutputKind } from '@/types';
import { OUTPUT_LABELS } from '@/services';
import { SOURCE_KIND_META } from '@/components/common';
import { OUTPUT_ICON } from './outputIcons';
import { Card, Button, Badge } from '@/components/ui';
import { AUDIENCE_OPTIONS, TONE_OPTIONS, LANGUAGE_OPTIONS } from '@/data/transformations';

interface GenerationPreviewProps {
  source: Source;
  config: TransformationConfig;
  outputKinds: OutputKind[];
  onGenerate: () => void;
}

function labelOf(options: { value: string; label: string }[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export function GenerationPreview({ source, config, outputKinds, onGenerate }: GenerationPreviewProps) {
  const { icon: KindIcon, label: kindLabel } = SOURCE_KIND_META[source.kind];

  return (
    <Card className="border-accent-500/25 bg-gradient-to-br from-ink-850/90 via-ink-850/80 to-ink-800/70">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-accent-300">
            <Sparkles aria-hidden className="h-4 w-4" />
            READY TO TRANSFORM
          </p>
          <h3 className="mt-2 text-lg font-bold text-slate-50">{source.title}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <KindIcon aria-hidden className="h-3.5 w-3.5" />
              {kindLabel} source
            </span>
            <span aria-hidden>·</span>
            <span>Audience: {labelOf(AUDIENCE_OPTIONS, config.audience)}</span>
            <span aria-hidden>·</span>
            <span>Tone: {labelOf(TONE_OPTIONS, config.tone)}</span>
            <span aria-hidden>·</span>
            <span>Language: {labelOf(LANGUAGE_OPTIONS, config.language)}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {outputKinds.map((k) => {
              const Icon = OUTPUT_ICON[k];
              return (
                <Badge key={k} tone="accent">
                  <Icon aria-hidden className="h-3 w-3" />
                  {OUTPUT_LABELS[k]}
                </Badge>
              );
            })}
          </div>
        </div>

        <div className="shrink-0">
          <Button
            variant="primary"
            size="lg"
            onClick={onGenerate}
            disabled={outputKinds.length === 0}
            leftIcon={<Sparkles aria-hidden className="h-4 w-4" />}
          >
            Generate Deliverables
          </Button>
          <p className="mt-2 text-right text-[10px] text-slate-500">
            {outputKinds.length} deliverable{outputKinds.length === 1 ? '' : 's'} · mock generation
          </p>
        </div>
      </div>
    </Card>
  );
}
