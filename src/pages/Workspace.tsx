import { Users, FileStack, Boxes, ShieldCheck, Cpu } from 'lucide-react';
import { Card, CardHeader, Badge } from '@/components/ui';

const TEAM = [
  { name: 'Operator', role: 'Workspace admin', initials: 'O', active: true },
  { name: 'Analyst A', role: 'Content reviewer', initials: 'A', active: false },
  { name: 'Analyst B', role: 'Content reviewer', initials: 'B', active: false },
];

const RESOURCES = [
  { label: 'Sources stored', value: '128', icon: FileStack },
  { label: 'Deliverables', value: '436', icon: Boxes },
  { label: 'Retention', value: '90 days', icon: ShieldCheck },
  { label: 'AI Engine tier', value: 'Standard', icon: Cpu },
];

export function Workspace() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Team */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Team"
            subtitle="People with access to this workspace."
            actions={<Badge tone="neutral">3 members</Badge>}
          />
          <ul role="list" className="divide-y divide-ink-700/40 px-5 pb-5">
            {TEAM.map((m) => (
              <li key={m.name} className="flex items-center gap-3 py-3.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-500 bg-gradient-to-b from-ink-700 to-ink-800 text-xs font-bold text-accent-300">
                  {m.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-100">{m.name}</p>
                  <p className="text-xs text-slate-400">{m.role}</p>
                </div>
                {m.active ? (
                  <Badge tone="success">You</Badge>
                ) : (
                  <Badge tone="neutral">Invited</Badge>
                )}
              </li>
            ))}
          </ul>
        </Card>

        {/* Environment */}
        <Card>
          <CardHeader title="Environment" subtitle="Workspace configuration." />
          <ul role="list" className="space-y-3 px-5 pb-5">
            <li className="rounded-lg border border-ink-700/60 bg-ink-900/50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Workspace</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-100">Standard Workspace</p>
            </li>
            <li className="rounded-lg border border-ink-700/60 bg-ink-900/50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Region</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-100">India (ap-south-1)</p>
            </li>
            <li className="rounded-lg border border-ink-700/60 bg-ink-900/50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Plan</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-100">SIH Evaluation</p>
            </li>
          </ul>
        </Card>
      </div>

      {/* Resource summary */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {RESOURCES.map((r) => (
          <Card key={r.label} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-400">{r.label}</p>
              <r.icon aria-hidden className="h-4 w-4 text-accent-400" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-50">{r.value}</p>
          </Card>
        ))}
      </div>

      <p className="flex items-center gap-2 text-[11px] text-slate-500">
        <Users aria-hidden className="h-3.5 w-3.5" />
        Team management is simulated in Phase 1 and becomes editable after backend integration.
      </p>
    </div>
  );
}
