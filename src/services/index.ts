/**
 * TRANSFORM-X service layer.
 *
 * Phase 1: every service resolves from local mock data with simulated latency,
 * so the UI exercises real loading states without a backend.
 * Phase 2: re-implement these methods against the FastAPI backend — the UI and
 * component contracts do not change.
 */

import type {
  Source,
  SourceKind,
  SourceAnalysis,
  Transformation,
  GeneratedOutput,
  OutputKind,
  TransformationConfig,
} from '@/types';
import { MOCK_TRANSFORMATIONS } from '@/data/transformations';
import { MOCK_ANALYSIS } from '@/data/analysis';
import { BODY_FACTORIES } from '@/data/outputs';
import { sleep, nowIso, makeId } from '@/utils';

/* ------------------------------- sourceService ------------------------------ */

export interface AnalyzeInput {
  kind: SourceKind;
  content?: string;
  url?: string;
  fileName?: string;
}

export interface SourceService {
  /** Analyse a source and return Source Intelligence (mock analysis in Phase 1). */
  analyze(input: AnalyzeInput): Promise<SourceAnalysis>;
}

class MockSourceService implements SourceService {
  async analyze(_input: AnalyzeInput): Promise<SourceAnalysis> {
    await sleep(700);
    // Phase 1 always returns the sample analysis; real NLP lands in Phase 2.
    return { ...MOCK_ANALYSIS };
  }
}

export const sourceService = new MockSourceService();

/* ----------------------------- transformService ----------------------------- */

export interface TransformationRequest {
  source: Source;
  config: TransformationConfig;
  outputKinds: OutputKind[];
}

export type ProgressCallback = (percent: number, stageIndex: number) => void;

export interface TransformService {
  /** Run a transformation end-to-end; resolves when generation is "complete". */
  run(request: TransformationRequest, onProgress?: ProgressCallback): Promise<{
    transformation: Transformation;
    outputs: GeneratedOutput[];
  }>;
}

/** Percent progress at which each pipeline stage completes (6 checkpoints). */
const STAGE_CHECKPOINTS = [14, 26, 44, 74, 96, 100];

class MockTransformService implements TransformService {
  async run(
    request: TransformationRequest,
    onProgress?: ProgressCallback,
  ): Promise<{ transformation: Transformation; outputs: GeneratedOutput[] }> {
    // Walk the checkpoints with pauses so the UI can animate stage progression.
    for (let i = 0; i < STAGE_CHECKPOINTS.length - 1; i += 1) {
      await sleep(650);
      onProgress?.(STAGE_CHECKPOINTS[i + 1], i + 1);
    }

    const createdAt = nowIso();
    const transformationId = makeId('TRX');

    const outputs: GeneratedOutput[] = request.outputKinds.map((kind) => ({
      id: makeId('OUT'),
      transformationId,
      kind,
      name: OUTPUT_LABELS[kind] ?? kind,
      description: OUTPUT_TAGLINES[kind] ?? '',
      status: 'ready',
      createdAt,
      body: BODY_FACTORIES[kind](),
    }));

    const transformation: Transformation = {
      id: transformationId,
      title: request.source.title,
      sourceKind: request.source.kind,
      outputKinds: [...request.outputKinds],
      status: 'completed',
      createdAt,
      processingSeconds: 42,
      config: request.config,
    };

    return { transformation, outputs };
  }
}

export const transformService = new MockTransformService();

/* ------------------------------ outputService ------------------------------- */

export interface OutputService {
  getForTransformation(transformationId: string): GeneratedOutput[];
}

export const OUTPUT_LABELS: Record<OutputKind, string> = {
  advisory: 'Advisory',
  'executive-summary': 'Executive Summary',
  linkedin: 'LinkedIn',
  'x-twitter': 'X / Twitter',
  presentation: 'Presentation',
  infographic: 'Infographic',
  'video-package': 'Video Package',
};

const OUTPUT_TAGLINES: Record<OutputKind, string> = {
  advisory: 'Structured advisory for operational communication.',
  'executive-summary': 'Concise briefing for decision makers.',
  linkedin: 'Professional, publication-ready content.',
  'x-twitter': 'Optimized post or thread.',
  presentation: 'Slides with speaker notes.',
  infographic: 'Key messaging and visual structure.',
  'video-package': 'Script, storyboard, narration, subtitles and visual recommendations.',
};

class MockOutputService implements OutputService {
  /** Phase 1: outputs live in client state after generation; this supports deep links later. */
  getForTransformation(_transformationId: string): GeneratedOutput[] {
    return [];
  }
}

export const outputService = new MockOutputService();

/* ------------------------------ historyService ------------------------------ */

export interface HistoryService {
  list(): Transformation[];
}

class MockHistoryService implements HistoryService {
  list(): Transformation[] {
    return [...MOCK_TRANSFORMATIONS];
  }
}

export const historyService = new MockHistoryService();
