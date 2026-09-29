import { CheckCircle2, Loader2, AlertTriangle, PencilLine } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TransformationStatus } from '@/types';
import { Badge } from '@/components/ui';
import { cx } from '@/utils';

const META: Record<TransformationStatus, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral'; icon: LucideIcon }> = {
  completed: { label: 'Completed', tone: 'success', icon: CheckCircle2 },
  processing: { label: 'Processing', tone: 'warning', icon: Loader2 },
  failed: { label: 'Failed', tone: 'danger', icon: AlertTriangle },
  draft: { label: 'Draft', tone: 'neutral', icon: PencilLine },
};

export function StatusBadge({ status, className }: { status: TransformationStatus; className?: string }) {
  const { label, tone, icon: Icon } = META[status];
  return (
    <Badge tone={tone} className={className}>
      <Icon aria-hidden className={cx('h-3 w-3', status === 'processing' && 'animate-spin')} />
      {label}
    </Badge>
  );
}
