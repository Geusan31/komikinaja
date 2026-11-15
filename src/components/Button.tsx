import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'chip' | 'chipActive';
  size?: 'sm' | 'md' | 'lg';
  pill?: boolean;
  fullWidth?: boolean;
}

/**
 * Tombol standar KomikinAja — terstandarisasi untuk konsistensi UI (Light & Dark Mode)
 * dengan target sentuh nyaman di perangkat mobile.
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  pill = false,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const isChip = variant === 'chip' || variant === 'chipActive';
  const radius = pill || isChip ? 'rounded-full' : 'rounded-lg';

  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'min-h-9 px-3.5 py-1.5 text-xs',
    md: 'min-h-11 px-4 py-2.5 text-sm',
    lg: 'min-h-12 px-6 py-3 text-base',
  };

  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm',
    secondary: 'bg-surface text-ink border border-[var(--color-line)] hover:brightness-95',
    outline: 'border-2 border-ink/30 text-ink hover:bg-primary hover:text-white hover:border-primary',
    ghost: 'text-ink hover:bg-ink/10',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    chip: 'bg-surface text-ink border border-[var(--color-line)] hover:border-ink/40',
    chipActive: 'bg-primary text-white border border-primary shadow-sm',
  };

  const baseStyles =
    'font-semibold transition-colors duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';
  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${radius} ${sizes[size]} ${variants[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
