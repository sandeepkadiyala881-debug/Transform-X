import { useEffect, useState } from 'react';
import { Cpu, FileStack, Database, Sun, MoonStar, Rows3, Clapperboard, CheckCircle2, Info } from 'lucide-react';
import type { Audience, Tone, Language, DetailLevel } from '@/types';
import type { TransformationConfig as TransformConfigShape } from '@/types';
import {
  AUDIENCE_OPTIONS,
  TONE_OPTIONS,
  LANGUAGE_OPTIONS,
  DETAIL_LEVEL_OPTIONS,
  DEFAULT_CONFIG,
} from '@/data/transformations';
import { Select, Card, CardHeader, Badge, Toasts } from '@/components/ui';
import { useToasts } from '@/hooks/useToasts';
import { cx } from '@/utils';

interface InterfacePrefs {
  theme: 'dark' | 'light';
  compact: boolean;
  animations: boolean;
}

const PREFS_KEY = 'transformx.prefs.v1';

const DEFAULT_PREFS: InterfacePrefs = { theme: 'dark', compact: false, animations: true };

function loadPrefs(): InterfacePrefs {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function Settings() {
  const { toasts, push, dismiss } = useToasts();

  /* Generation defaults (mock persistence) */
  const [defaults, setDefaults] = useState<TransformConfigShape>({ ...DEFAULT_CONFIG });

  /* Interface prefs */
  const [prefs, setPrefs] = useState<InterfacePrefs>(() => loadPrefs());

  useEffect(() => {
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      /* storage unavailable — prefs stay session-local */
    }
  }, [prefs]);

  const systemServices = [
    { id: 'ai', label: 'AI Engine', icon: Cpu, detail: 'Transformation pipeline ready', latency: '42s avg' },
    { id: 'docs', label: 'Document Processing', icon: FileStack, detail: 'PDF · DOCX · TXT extraction', latency: '1.2s avg' },
    { id: 'storage', label: 'Storage', icon: Database, detail: 'Sources and deliverables', latency: '32ms avg' },
  ];

  return (
    <div className="space-y-6">
      <Toasts toasts={toasts} onDismiss={dismiss} />

      {/* Generation defaults */}
      <Card>
        <CardHeader
          title="Generation Defaults"
          subtitle="Pre-applied to every new transformation. Change once, use everywhere."
          actions={<Badge tone="accent">Workspace</Badge>}
        />
        <div className="grid grid-cols-1 gap-4 px-5 pb-5 sm:grid-cols-2 xl:grid-cols-4">
          <Select
            label="Default Audience"
            options={AUDIENCE_OPTIONS}
            value={defaults.audience}
            onChange={(e) => {
              setDefaults((d) => ({ ...d, audience: e.target.value as Audience }));
              push('success', 'Default audience saved.');
            }}
          />
          <Select
            label="Default Tone"
            options={TONE_OPTIONS}
            value={defaults.tone}
            onChange={(e) => {
              setDefaults((d) => ({ ...d, tone: e.target.value as Tone }));
              push('success', 'Default tone saved.');
            }}
          />
          <Select
            label="Default Language"
            options={LANGUAGE_OPTIONS}
            value={defaults.language}
            onChange={(e) => {
              setDefaults((d) => ({ ...d, language: e.target.value as Language }));
              push('success', 'Default language saved.');
            }}
          />
          <Select
            label="Default Detail Level"
            options={DETAIL_LEVEL_OPTIONS}
            value={defaults.detailLevel}
            onChange={(e) => {
              setDefaults((d) => ({ ...d, detailLevel: e.target.value as DetailLevel }));
              push('success', 'Default detail level saved.');
            }}
          />
        </div>
      </Card>

      {/* Interface */}
      <Card>
        <CardHeader title="Interface" subtitle="Tune the workspace to your display and preference." />
        <ul role="list" className="divide-y divide-ink-700/40 px-5 pb-5">
          <li className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="text-sm font-medium text-slate-100">Theme</p>
              <p className="mt-0.5 text-xs text-slate-400">TRANSFORM-X is dark-first; a light theme is planned.</p>
            </div>
            <div className="flex rounded-lg border border-ink-600 bg-ink-800 p-1" role="group" aria-label="Theme">
              <button
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, theme: 'dark' }))}
                className={cx(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                  prefs.theme === 'dark' ? 'bg-accent-500/15 text-accent-300' : 'text-slate-400 hover:text-slate-200',
                )}
                aria-pressed={prefs.theme === 'dark'}
              >
                <MoonStar aria-hidden className="h-3.5 w-3.5" /> Dark
              </button>
              <button
                type="button"
                onClick={() => push('info', 'Light theme arrives with the design system refresh.')}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                <Sun aria-hidden className="h-3.5 w-3.5" /> Light
              </button>
            </div>
          </li>

          <ToggleRow
            icon={Rows3}
            title="Compact Mode"
            description="Tighter spacing across panels and tables."
            enabled={prefs.compact}
            onToggle={() => {
              setPrefs((p) => ({ ...p, compact: !p.compact }));
              push('success', 'Compact mode preference saved.');
            }}
          />

          <ToggleRow
            icon={Clapperboard}
            title="Animations"
            description="Subtle motion for transitions and the pipeline visual."
            enabled={prefs.animations}
            onToggle={() => {
              setPrefs((p) => ({ ...p, animations: !p.animations }));
              push('success', 'Animation preference saved.');
            }}
          />
        </ul>
      </Card>

      {/* System status */}
      <Card>
        <CardHeader title="System Status" subtitle="Live view of platform services." actions={<Badge tone="success">All systems operational</Badge>} />
        <ul role="list" className="divide-y divide-ink-700/40 px-5 pb-5">
          {systemServices.map((svc) => (
            <li key={svc.id} className="flex items-center gap-4 py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-accent-400">
                <svc.icon aria-hidden className="h-4.5 w-4.5 h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-100">{svc.label}</p>
                <p className="text-xs text-slate-400">{svc.detail}</p>
              </div>
              <span className="hidden font-mono text-[10px] text-slate-500 sm:block">{svc.latency}</span>
              <Badge tone="success">
                <CheckCircle2 aria-hidden className="h-3 w-3" />
                Operational
              </Badge>
            </li>
          ))}
        </ul>
        <p className="flex items-start gap-2 border-t border-ink-700/50 px-5 py-3 text-[11px] leading-4 text-slate-500">
          <Info aria-hidden className="mt-0.5 h-3 w-3 shrink-0" />
          Status indicators are simulated in Phase 1 and will reflect real service health checks after backend integration.
        </p>
      </Card>
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  description,
  enabled,
  onToggle,
}: {
  icon: typeof Rows3;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-slate-400">
          <Icon aria-hidden className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-medium text-slate-100">{title}</p>
          <p className="mt-0.5 text-xs text-slate-400">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={title}
        onClick={onToggle}
        className={cx(
          'relative h-6 w-11 shrink-0 rounded-full border transition-colors',
          enabled ? 'border-accent-500/50 bg-accent-500/30' : 'border-ink-500 bg-ink-700',
        )}
      >
        <span
          aria-hidden
          className={cx(
            'absolute top-0.5 h-4.5 w-4.5 h-[18px] w-[18px] rounded-full bg-slate-100 shadow transition-all',
            enabled ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </button>
    </li>
  );
}
