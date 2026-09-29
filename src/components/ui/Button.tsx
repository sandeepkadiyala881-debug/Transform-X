import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-accent-400 to-accent-600 text-ink-950 font-semibold shadow-glow hover:from-accent-300 hover:to-accent-500 active:from-accent-500 active:to-accent-600',
  secondary:
    'bg-ink-750 text-slate-200 border border-ink-600 hover:border-accent-500/50 hover:text-white hover:bg-ink-700',
  ghost: 'text-slate-300 hover:text-white hover:bg-ink-750/70 border border-transparent',
  danger:
    'bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 hover:text-red-200',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-sm gap-2.5 rounded-lg',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  leftIcon,
  rightIcon,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-all duration-150',
        'focus-visible:ring-2 focus-visible:ring-accent-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 focus:outline-none',
        'disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
