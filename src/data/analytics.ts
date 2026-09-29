import type { OutputKind, SourceKind } from '@/types';

/* ------------------------------ KPI summary ------------------------------ */

export const ANALYTICS_KPIS = [
  { id: 'an-transformations', label: 'Transformations', value: '128' },
  { id: 'an-outputs', label: 'Outputs', value: '436' },
  { id: 'an-processing', label: 'Average Processing', value: '42s' },
  { id: 'an-success', label: 'Success Rate', value: '98.7%' },
];

/* --------------------------- Transformations over time --------------------------- */

export const TRANSFORMATIONS_OVER_TIME = [
  { month: 'Apr', transformations: 14, outputs: 41 },
  { month: 'May', transformations: 19, outputs: 58 },
  { month: 'Jun', transformations: 22, outputs: 73 },
  { month: 'Jul', transformations: 26, outputs: 89 },
  { month: 'Aug', transformations: 23, outputs: 78 },
  { month: 'Sep', transformations: 24, outputs: 97 },
];

/* ------------------------------ Output usage ------------------------------ */

export const OUTPUT_USAGE: { kind: OutputKind; name: string; count: number }[] = [
  { kind: 'advisory', name: 'Advisory', count: 118 },
  { kind: 'executive-summary', name: 'Executive Summary', count: 96 },
  { kind: 'linkedin', name: 'LinkedIn', count: 74 },
  { kind: 'presentation', name: 'Presentation', count: 52 },
  { kind: 'x-twitter', name: 'X / Twitter', count: 38 },
  { kind: 'infographic', name: 'Infographic', count: 34 },
  { kind: 'video-package', name: 'Video Package', count: 24 },
];

/* --------------------------- Source distribution --------------------------- */

export const SOURCE_DISTRIBUTION: { kind: SourceKind; name: string; count: number }[] = [
  { kind: 'document', name: 'Document', count: 52 },
  { kind: 'text', name: 'Text', count: 34 },
  { kind: 'url', name: 'URL', count: 22 },
  { kind: 'image', name: 'Image', count: 12 },
  { kind: 'video', name: 'Video', count: 8 },
];

/* ------------------------------- Bar colors ------------------------------- */

export const CHART_COLORS = {
  cyan: '#22d3ee',
  blue: '#60a5fa',
  slate: '#64748b',
  dim: '#475569',
};
