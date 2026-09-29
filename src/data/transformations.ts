import type {
  Audience,
  Tone,
  Language,
  DetailLevel,
  Objective,
  ContentStyle,
  Transformation,
  SourceKind,
  Notification,
} from '@/types';

/* ------------------------------ Select options ------------------------------ */

export const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: 'general-public', label: 'General Public' },
  { value: 'technical-team', label: 'Technical Team' },
  { value: 'executives', label: 'Executives' },
  { value: 'government-officials', label: 'Government Officials' },
  { value: 'security-officers', label: 'Security Officers' },
];

export const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'formal', label: 'Formal' },
  { value: 'technical', label: 'Technical' },
  { value: 'informative', label: 'Informative' },
  { value: 'urgent', label: 'Urgent' },
];

export const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'telugu', label: 'Telugu' },
];

export const DETAIL_LEVEL_OPTIONS: { value: DetailLevel; label: string }[] = [
  { value: 'brief', label: 'Brief' },
  { value: 'standard', label: 'Standard' },
  { value: 'detailed', label: 'Detailed' },
];

export const OBJECTIVE_OPTIONS: { value: Objective; label: string }[] = [
  { value: 'inform', label: 'Inform' },
  { value: 'alert', label: 'Alert' },
  { value: 'educate', label: 'Educate' },
  { value: 'brief', label: 'Brief' },
  { value: 'publish', label: 'Publish' },
];

export const CONTENT_STYLE_OPTIONS: { value: ContentStyle; label: string }[] = [
  { value: 'report', label: 'Report' },
  { value: 'advisory', label: 'Advisory' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'social', label: 'Social' },
  { value: 'presentation', label: 'Presentation' },
];

export const DEFAULT_CONFIG = {
  audience: 'security-officers',
  tone: 'professional',
  language: 'english',
  detailLevel: 'standard',
  objective: 'inform',
  contentStyle: 'advisory',
} as const;

/* ------------------------------- Transformations ---------------------------- */

export const MOCK_TRANSFORMATIONS: Transformation[] = [
  {
    id: 'TRX-0412',
    title: 'Cybersecurity Threat Report',
    sourceKind: 'document',
    outputKinds: ['advisory', 'executive-summary', 'linkedin'],
    status: 'completed',
    createdAt: '2026-09-28T14:32:00',
    processingSeconds: 38,
    config: {
      audience: 'security-officers',
      tone: 'professional',
      language: 'english',
      detailLevel: 'detailed',
      objective: 'alert',
      contentStyle: 'advisory',
    },
  },
  {
    id: 'TRX-0411',
    title: 'Infrastructure Incident Report',
    sourceKind: 'document',
    outputKinds: ['executive-summary', 'presentation'],
    status: 'completed',
    createdAt: '2026-09-28T11:08:00',
    processingSeconds: 44,
    config: {
      audience: 'executives',
      tone: 'formal',
      language: 'english',
      detailLevel: 'standard',
      objective: 'brief',
      contentStyle: 'report',
    },
  },
  {
    id: 'TRX-0410',
    title: 'Policy Announcement',
    sourceKind: 'url',
    outputKinds: ['linkedin', 'infographic'],
    status: 'completed',
    createdAt: '2026-09-27T16:45:00',
    processingSeconds: 29,
    config: {
      audience: 'general-public',
      tone: 'informative',
      language: 'english',
      detailLevel: 'brief',
      objective: 'inform',
      contentStyle: 'corporate',
    },
  },
  {
    id: 'TRX-0409',
    title: 'Field Safety Bulletin',
    sourceKind: 'text',
    outputKinds: ['advisory', 'infographic', 'video-package'],
    status: 'completed',
    createdAt: '2026-09-27T10:12:00',
    processingSeconds: 52,
    config: {
      audience: 'general-public',
      tone: 'urgent',
      language: 'hindi',
      detailLevel: 'standard',
      objective: 'alert',
      contentStyle: 'advisory',
    },
  },
  {
    id: 'TRX-0408',
    title: 'Quarterly Performance Review',
    sourceKind: 'document',
    outputKinds: ['executive-summary', 'presentation'],
    status: 'completed',
    createdAt: '2026-09-26T09:30:00',
    processingSeconds: 47,
    config: {
      audience: 'executives',
      tone: 'professional',
      language: 'english',
      detailLevel: 'detailed',
      objective: 'brief',
      contentStyle: 'presentation',
    },
  },
  {
    id: 'TRX-0407',
    title: 'Public Advisory Draft',
    sourceKind: 'image',
    outputKinds: ['advisory'],
    status: 'processing',
    createdAt: '2026-09-26T15:04:00',
    processingSeconds: 0,
    config: {
      audience: 'government-officials',
      tone: 'formal',
      language: 'telugu',
      detailLevel: 'standard',
      objective: 'inform',
      contentStyle: 'advisory',
    },
  },
  {
    id: 'TRX-0406',
    title: 'Product Launch Announcement',
    sourceKind: 'video',
    outputKinds: ['linkedin', 'x-twitter', 'video-package'],
    status: 'failed',
    createdAt: '2026-09-25T13:20:00',
    processingSeconds: 0,
    config: {
      audience: 'general-public',
      tone: 'informative',
      language: 'english',
      detailLevel: 'brief',
      objective: 'publish',
      contentStyle: 'social',
    },
  },
  {
    id: 'TRX-0405',
    title: 'Monsoon Relief Coordination Note',
    sourceKind: 'text',
    outputKinds: ['executive-summary', 'advisory', 'infographic'],
    status: 'completed',
    createdAt: '2026-09-24T08:05:00',
    processingSeconds: 41,
    config: {
      audience: 'government-officials',
      tone: 'formal',
      language: 'english',
      detailLevel: 'standard',
      objective: 'brief',
      contentStyle: 'report',
    },
  },
];

/* ------------------------------- Notifications ------------------------------ */

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    title: 'Transformation complete',
    detail: 'Cybersecurity Threat Report produced 3 deliverables.',
    time: '12m ago',
    unread: true,
  },
  {
    id: 'n2',
    title: 'Transformation complete',
    detail: 'Infrastructure Incident Report produced 2 deliverables.',
    time: '3h ago',
    unread: true,
  },
  {
    id: 'n3',
    title: 'Generation failed',
    detail: 'Product Launch Announcement could not be completed. Source video could not be decoded.',
    time: '3d ago',
    unread: false,
  },
];

/* --------------------------- Quick-start shortcuts -------------------------- */

export const QUICK_START_OPTIONS: { kind: SourceKind; label: string; hint: string }[] = [
  { kind: 'text', label: 'Paste Text', hint: 'Type or paste content directly' },
  { kind: 'document', label: 'Upload Document', hint: 'PDF · DOCX · TXT' },
  { kind: 'image', label: 'Upload Image', hint: 'PNG · JPG · screenshots' },
  { kind: 'video', label: 'Upload Video', hint: 'MP4 · briefings, walkthroughs' },
  { kind: 'url', label: 'Analyze URL', hint: 'Articles and webpages' },
];
