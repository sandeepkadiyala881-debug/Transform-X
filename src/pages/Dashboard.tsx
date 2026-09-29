import { useNavigate } from 'react-router-dom';
import { Plus, History, Clock3 } from 'lucide-react';
import { KpiRow } from '@/components/dashboard/KpiRow';
import { PipelineCard } from '@/components/dashboard/PipelineCard';
import { RecentTransformations } from '@/components/dashboard/RecentTransformations';
import { QuickStart } from '@/components/dashboard/QuickStart';
import { Button } from '@/components/ui';
import { greeting } from '@/utils';

export function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section aria-labelledby="dashboard-heading" className="relative overflow-hidden rounded-2xl border border-ink-700/60 bg-ink-850/70 bg-radial-fade px-5 py-7 shadow-panel sm:px-8 sm:py-9">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Clock3 aria-hidden className="h-3.5 w-3.5" />
            {greeting()}, Operator.
          </p>
          <h2 id="dashboard-heading" className="mt-2 text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">
            Transform information into communication.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
            Analyze a source, configure your objective, and generate the deliverables you need.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button variant="primary" size="lg" onClick={() => navigate('/transform')} leftIcon={<Plus aria-hidden className="h-4 w-4" />}>
              New Transformation
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate('/history')} leftIcon={<History aria-hidden className="h-4 w-4" />}>
              View History
            </Button>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <KpiRow />

      {/* Main visual + quick start */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PipelineCard />
        </div>
        <QuickStart />
      </div>

      {/* Recent */}
      <RecentTransformations />
    </div>
  );
}
