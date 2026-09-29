import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import type { Toast } from '@/hooks/useToasts';
import { cx } from '@/utils';

const ICONS = {
  success: CheckCircle2,
  info: Info,
  error: AlertTriangle,
};

const STYLES: Record<Toast['kind'], string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-100',
  error: 'border-red-500/30 bg-red-500/10 text-red-100',
};

export function Toasts({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(92vw,360px)] flex-col gap-2"
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.kind];
        return (
          <div
            key={toast.id}
            role="status"
            className={cx(
              'pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm shadow-panel-hover backdrop-blur-md',
              'animate-fade-up',
              STYLES[toast.kind],
            )}
          >
            <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="flex-1 leading-5">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="rounded p-0.5 text-current opacity-60 transition-opacity hover:opacity-100"
            >
              <X aria-hidden className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
