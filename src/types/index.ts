/**
 * TRANSFORM-X domain types.
 *
 * These mirror the future FastAPI schemas one-to-one so the service layer can
 * later be swapped from mock data to real API responses without touching UI code.
 */

/* ---------------------------------- Source --------------------------------- */

export type SourceKind = 'text' | 'document' | 'image' | 'video' | 'url';

export interface Source {
  id: string;
  kind: SourceKind;
  title: string;
  /** Extracted plain-text content for text/url sources; for files this is the extracted body. */
  content?: string;
  /** Attached file metadata for document/image/video sources. */
  file?: SourceFile;
  /** Attached URL for url sources. */
  url?: string;
  createdAt: string;
}

export interface SourceFile {
  name: string;
  sizeBytes: number;
  mime?: string;
  /** Local object URL for preview purposes (never persisted). */
  previewUrl?: string;
}

/* --------------------------------- Analysis -------------------------------- */

export type AnalysisLength = 'short' | 'medium' | 'long';

export interface SourceAnalysis {
  contentType: string;
  language: string;
  estimatedLength: AnalysisLength;
  keyTopics: string[];
  entities: {
    organizations: string[];
    systems: string[];
    threatActors?: string[];
  };
  /** 0–100 mock confidence score. */
  confidence: number;
}

/* ------------------------------- Configuration ----------------------------- */

export type Audience =
  | 'general-public'
  | 'technical-team'
  | 'executives'
  | 'government-officials'
  | 'security-officers';

export type Tone = 'professional' | 'formal' | 'technical' | 'informative' | 'urgent';

export type Language = 'english' | 'hindi' | 'telugu';

export type DetailLevel = 'brief' | 'standard' | 'detailed';

export type Objective = 'inform' | 'alert' | 'educate' | 'brief' | 'publish';

export type ContentStyle = 'report' | 'advisory' | 'corporate' | 'social' | 'presentation';

export interface TransformationConfig {
  audience: Audience;
  tone: Tone;
  language: Language;
  detailLevel: DetailLevel;
  objective: Objective;
  contentStyle: ContentStyle;
}

/* ---------------------------------- Outputs -------------------------------- */

export type OutputKind =
  | 'advisory'
  | 'executive-summary'
  | 'linkedin'
  | 'x-twitter'
  | 'presentation'
  | 'infographic'
  | 'video-package';

export type OutputStatus = 'ready' | 'generating' | 'failed';

export interface GeneratedOutput {
  id: string;
  transformationId: string;
  kind: OutputKind;
  name: string;
  description: string;
  status: OutputStatus;
  createdAt: string;
  /** Structured body depends on the output kind; see data/outputs.ts mock renderers. */
  body: OutputBody;
}

export type OutputBody =
  | AdvisoryBody
  | SummaryBody
  | SocialPostBody
  | PresentationBody
  | InfographicBody
  | VideoPackageBody;

export interface AdvisoryBody {
  kind: 'advisory';
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
  title: string;
  sections: { heading: string; paragraphs: string[]; bullets?: string[] }[];
}

export interface SummaryBody {
  kind: 'summary';
  headline: string;
  keyPoints: string[];
  decisionsRequired: string[];
}

export interface SocialPostBody {
  kind: 'social';
  platform: 'linkedin' | 'x-twitter';
  text: string;
  hashtags: string[];
}

export interface PresentationBody {
  kind: 'presentation';
  slides: { title: string; bullets: string[]; speakerNotes: string }[];
}

export interface InfographicBody {
  kind: 'infographic';
  headline: string;
  stats: { label: string; value: string }[];
  callouts: string[];
}

export interface VideoPackageBody {
  kind: 'video-package';
  logline: string;
  script: { timecode: string; narration: string; visual: string }[];
  subtitles: string[];
}

/* ------------------------------ Transformation ----------------------------- */

export type TransformationStatus = 'completed' | 'processing' | 'failed' | 'draft';

export interface Transformation {
  id: string;
  title: string;
  sourceKind: SourceKind;
  outputKinds: OutputKind[];
  status: TransformationStatus;
  createdAt: string;
  processingSeconds: number;
  config: TransformationConfig;
}

/* -------------------------------- Generation ------------------------------- */

export interface GenerationStage {
  id: string;
  label: string;
  description: string;
}

export type GenerationStatus = 'idle' | 'running' | 'complete';

export interface GenerationProgress {
  status: GenerationStatus;
  stageIndex: number;
  percent: number;
}

/* ------------------------------ Output catalog ----------------------------- */

export interface OutputDescriptor {
  kind: OutputKind;
  name: string;
  tagline: string;
}

export interface NavItem {
  id: string;
  label: string;
  to: string;
  group: 'main' | 'workspace';
}

export interface Notification {
  id: string;
  title: string;
  detail: string;
  time: string;
  unread: boolean;
}
