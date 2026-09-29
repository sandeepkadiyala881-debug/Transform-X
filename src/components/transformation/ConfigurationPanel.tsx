import type { TransformationConfig } from '@/types';
import {
  AUDIENCE_OPTIONS,
  TONE_OPTIONS,
  LANGUAGE_OPTIONS,
  DETAIL_LEVEL_OPTIONS,
  OBJECTIVE_OPTIONS,
  CONTENT_STYLE_OPTIONS,
} from '@/data/transformations';
import { Select } from '@/components/ui';

interface ConfigurationPanelProps {
  config: TransformationConfig;
  onChange: (next: TransformationConfig) => void;
}

export function ConfigurationPanel({ config, onChange }: ConfigurationPanelProps) {
  return (
    <section aria-labelledby="config-heading">
      <div className="mb-4">
        <h3 id="config-heading" className="text-base font-semibold text-slate-100">
          Generation Configuration
        </h3>
        <p className="mt-0.5 text-xs text-slate-400">
          Shape how every deliverable is written — one configuration applies across all selected outputs.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-ink-600/60 bg-ink-850/80 p-4 shadow-panel sm:grid-cols-2 lg:grid-cols-3 sm:p-5">
        <Select
          label="Target Audience"
          options={AUDIENCE_OPTIONS}
          value={config.audience}
          onChange={(e) => onChange({ ...config, audience: e.target.value as TransformationConfig['audience'] })}
        />
        <Select
          label="Tone"
          options={TONE_OPTIONS}
          value={config.tone}
          onChange={(e) => onChange({ ...config, tone: e.target.value as TransformationConfig['tone'] })}
        />
        <Select
          label="Language"
          options={LANGUAGE_OPTIONS}
          value={config.language}
          onChange={(e) => onChange({ ...config, language: e.target.value as TransformationConfig['language'] })}
        />
        <Select
          label="Detail Level"
          options={DETAIL_LEVEL_OPTIONS}
          value={config.detailLevel}
          onChange={(e) => onChange({ ...config, detailLevel: e.target.value as TransformationConfig['detailLevel'] })}
        />
        <Select
          label="Communication Objective"
          options={OBJECTIVE_OPTIONS}
          value={config.objective}
          onChange={(e) => onChange({ ...config, objective: e.target.value as TransformationConfig['objective'] })}
        />
        <Select
          label="Content Style"
          options={CONTENT_STYLE_OPTIONS}
          value={config.contentStyle}
          onChange={(e) => onChange({ ...config, contentStyle: e.target.value as TransformationConfig['contentStyle'] })}
        />
      </div>
    </section>
  );
}
