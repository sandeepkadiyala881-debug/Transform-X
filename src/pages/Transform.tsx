import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import type { Source, SourceAnalysis, TransformationConfig, GeneratedOutput, OutputKind, SourceKind } from '@/types';
import { WorkflowStepper } from '@/components/transformation/WorkflowStepper';
import type { WorkflowStep } from '@/components/transformation/WorkflowStepper';
import { SourceInput } from '@/components/transformation/SourceInput';
import type { SourceInputResult } from '@/components/transformation/SourceInput';
import { SourceIntelligencePanel } from '@/components/transformation/SourceIntelligencePanel';
import { OutputSelector } from '@/components/transformation/OutputSelector';
import { ConfigurationPanel } from '@/components/transformation/ConfigurationPanel';
import { GenerationPreview } from '@/components/transformation/GenerationPreview';
import { GenerationModal } from '@/components/transformation/GenerationModal';
import { transformService, sourceService } from '@/services';
import { MockOutputStore } from '@/services/outputStore';
import { DEFAULT_CONFIG } from '@/data/transformations';
import { useToasts } from '@/hooks/useToasts';
import { Button, Toasts } from '@/components/ui';
import { nowIso, makeId } from '@/utils';

export function Transform() {
  const navigate = useNavigate();
  const { toasts, push, dismiss } = useToasts();

  /* ------------------------------ workflow state ----------------------------- */
  const [step, setStep] = useState<WorkflowStep>('source');
  const [source, setSource] = useState<Source | null>(null);
  const [analysis, setAnalysis] = useState<SourceAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedOutputs, setSelectedOutputs] = useState<OutputKind[]>([]);
  const [config, setConfig] = useState<TransformationConfig>({ ...DEFAULT_CONFIG });

  /* ---------------------------- generation state ----------------------------- */
  const [modalOpen, setModalOpen] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [percent, setPercent] = useState(0);
  const [complete, setComplete] = useState(false);
  const [generated, setGenerated] = useState<{ transformationId: string; outputs: GeneratedOutput[] } | null>(null);
  const runIdRef = useRef(0);

  /* --------------------------- source submission ----------------------------- */
  const handleSourceReady = useCallback(
    async (result: SourceInputResult) => {
      const sourceObj: Source = {
        id: makeId('SRC'),
        kind: result.kind,
        title: result.title,
        content: result.content,
        url: result.url,
        createdAt: nowIso(),
        file: result.fileName
          ? { name: result.fileName, sizeBytes: result.fileSizeBytes ?? 0 }
          : undefined,
      };

      setSource(sourceObj);
      setAnalyzing(true);
      setAnalysis(null);

      try {
        const resultAnalysis = await sourceService.analyze({
          kind: result.kind as SourceKind,
          content: result.content,
          url: result.url,
          fileName: result.fileName,
        });
        setAnalysis(resultAnalysis);
        setStep('configure');
        push('info', 'Source analyzed — configure your transformation below.');
      } finally {
        setAnalyzing(false);
      }
    },
    [push],
  );

  /* ------------------------------- generation -------------------------------- */
  const handleGenerate = useCallback(async () => {
    if (!source || selectedOutputs.length === 0 || modalOpen) return;

    setModalOpen(true);
    setComplete(false);
    setStageIndex(0);
    setPercent(4);
    setGenerated(null);
    const runId = ++runIdRef.current;

    try {
      const { transformation, outputs } = await transformService.run(
        { source, config, outputKinds: selectedOutputs },
        (pct, stage) => {
          if (runIdRef.current !== runId) return;
          setPercent(pct);
          setStageIndex(Math.min(stage, 4));
        },
      );

      if (runIdRef.current !== runId) return;
      MockOutputStore.set(outputs);
      setGenerated({ transformationId: transformation.id, outputs });
      setComplete(true);
    } catch {
      push('error', 'Generation failed. Please try again.');
      setModalOpen(false);
    }
  }, [source, selectedOutputs, config, modalOpen, push]);

  function handleViewDeliverables() {
    if (!generated) return;
    navigate('/outputs', {
      state: {
        outputs: generated.outputs,
        transformationTitle: source?.title ?? 'Transformation',
        transformationId: generated.transformationId,
      },
    });
  }

  /* --------------------------------- render ---------------------------------- */
  return (
    <div className="space-y-6">
      {/* Header + stepper */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-50">New Transformation</h2>
          <p className="mt-1 text-sm text-slate-400">
            Provide a source and choose how you want it transformed.
          </p>
        </div>
        <WorkflowStepper current={step} />
      </div>

      {/* Step 1 — source + intelligence */}
      {step === 'source' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SourceInput onReady={handleSourceReady} />
          </div>
          <SourceIntelligencePanel analysis={analysis} analyzing={analyzing} />
        </div>
      )}

      {/* Steps 2/3 — outputs + configuration + preview */}
      {step !== 'source' && source && (
        <div className="space-y-6">
          {/* Source summary strip */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-600/60 bg-ink-850/80 px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-accent-400">
              <FileText aria-hidden className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-100">{source.title}</p>
              <p className="text-[11px] text-slate-400">Source attached · Source Intelligence below</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep('source')}>
              Change source
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <OutputSelector selected={selectedOutputs} onChange={setSelectedOutputs} />
              <ConfigurationPanel config={config} onChange={setConfig} />
            </div>
            <div className="space-y-6">
              <SourceIntelligencePanel analysis={analysis} analyzing={false} />
            </div>
            <div className="lg:col-span-3">
              <GenerationPreview
                source={source}
                config={config}
                outputKinds={selectedOutputs}
                onGenerate={handleGenerate}
              />
            </div>
          </div>
        </div>
      )}

      {/* Empty guard: configure step needs a source */}
      {step !== 'source' && !source && (
        <div className="rounded-xl border border-dashed border-ink-600 bg-ink-900/40 px-6 py-12 text-center">
          <p className="text-sm text-slate-400">No source attached yet.</p>
          <Button className="mt-4" variant="secondary" onClick={() => setStep('source')}>
            Go to Source
          </Button>
        </div>
      )}

      <GenerationModal
        open={modalOpen}
        stageIndex={stageIndex}
        percent={percent}
        complete={complete}
        outputs={generated?.outputs ?? []}
        onViewDeliverables={handleViewDeliverables}
      />

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
