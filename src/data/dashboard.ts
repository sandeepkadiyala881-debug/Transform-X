import type { LucideIcon } from 'lucide-react';
import {
  FileInput,
  BrainCircuit,
  Crosshair,
  Workflow,
  PackageCheck,
  Layers,
  SlidersHorizontal,
  PackageOpen,
} from 'lucide-react';

/* ---------------------------------- KPIs ----------------------------------- */

export interface Kpi {
  id: string;
  label: string;
  value: string;
  trend: string;
  direction: 'up' | 'down';
  caption: string;
}

export const DASHBOARD_KPIS: Kpi[] = [
  { id: 'kpi-transformations', label: 'Transformations', value: '128', trend: '+12.4%', direction: 'up', caption: 'last 30 days' },
  { id: 'kpi-deliverables', label: 'Deliverables Generated', value: '436', trend: '+18.2%', direction: 'up', caption: 'all time' },
  { id: 'kpi-processing', label: 'Average Processing', value: '42s', trend: '-8.1%', direction: 'down', caption: 'per source' },
  { id: 'kpi-success', label: 'Success Rate', value: '98.7%', trend: '+2.3%', direction: 'up', caption: 'last 30 days' },
];

/* ---------------------------- Pipeline stages ------------------------------ */

export interface PipelineStage {
  id: string;
  index: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'stage-source',
    index: '01',
    title: 'SOURCE',
    description: 'Text, documents, images, video or a URL enter the platform.',
    icon: FileInput,
  },
  {
    id: 'stage-understanding',
    index: '02',
    title: 'CONTENT UNDERSTANDING',
    description: 'Content type, language, topics and entities are extracted.',
    icon: BrainCircuit,
  },
  {
    id: 'stage-context',
    index: '03',
    title: 'CONTEXT & INTENT',
    description: 'Audience, objective and communication intent are resolved.',
    icon: Crosshair,
  },
  {
    id: 'stage-transformation',
    index: '04',
    title: 'TRANSFORMATION',
    description: 'Selected deliverables are generated under your configuration.',
    icon: Workflow,
  },
  {
    id: 'stage-deliverables',
    index: '05',
    title: 'DELIVERABLES',
    description: 'Advisories, summaries, posts, decks and packages ready to ship.',
    icon: PackageCheck,
  },
];

/* ------------------------- Landing capability cards ------------------------- */

export interface Capability {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const CAPABILITIES: Capability[] = [
  {
    id: 'cap-multimodal',
    title: 'MULTIMODAL INPUT',
    description: 'Text, documents, images, video and URLs.',
    icon: Layers,
  },
  {
    id: 'cap-configurable',
    title: 'CONFIGURABLE AI',
    description: 'Audience, tone, language and detail under your control.',
    icon: SlidersHorizontal,
  },
  {
    id: 'cap-multioutput',
    title: 'MULTI-OUTPUT',
    description: 'Seven deliverable types from a single source.',
    icon: PackageOpen,
  },
];

/* --------------------------- Landing flow steps ----------------------------- */

export interface FlowStep {
  id: string;
  title: string;
}

export const LANDING_FLOW: FlowStep[] = [
  { id: 'flow-source', title: 'SOURCE' },
  { id: 'flow-understanding', title: 'AI UNDERSTANDING' },
  { id: 'flow-transformation', title: 'TRANSFORMATION' },
  { id: 'flow-deliverables', title: 'DELIVERABLES' },
];
