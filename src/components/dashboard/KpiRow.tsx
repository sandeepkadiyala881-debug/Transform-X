import { TrendingUp, TrendingDown } from 'lucide-react';
import { DASHBOARD_KPIS } from '@/data/dashboard';
import { Card } from '@/components/ui';
import { cx } from '@/utils';

export function KpiRow() {
  return (
    <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {DASHBOARD_KPIS.map((kpi, i) => (
        <Card key={kpi.id} className="animate-fade-up p-4" style={{ animationDelay: `${i * 60}ms` }}>
          <p className="text-xs font-medium text-slate-400">{kpi.label}</p>
          <div className="mt-2 flex items-end justify-between gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-50">{kpi.value}</span>
            <span
              className={cx(
                'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                kpi.direction === 'up' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-blue-500/10 text-blue-300',
              )}
            >
              {kpi.direction === 'up' ? <TrendingUp aria-hidden className="h-3 w-3" /> : <TrendingDown aria-hidden className="h-3 w-3" />}
              {kpi.trend}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">{kpi.caption}</p>
        </Card>
      ))}
    </section>
  );
}
