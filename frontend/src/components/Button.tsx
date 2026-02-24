import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
  className?: string; // Add optional className
  disabled?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-[var(--brand-primary)] 
    text-[var(--bg-primary)] 
    border-[var(--brand-primary)]
    theme-btn
    hover:opacity-90
    active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed
    font-[var(--font-title)]
  `,
  secondary: `
    bg-transparent
    text-[var(--text-primary)] 
    border-[var(--brand-primary)]
    theme-btn
    hover:bg-[var(--brand-primary)]
    hover:text-[var(--bg-primary)]
    active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  ghost: `
    bg-transparent 
    text-[var(--text-secondary)] 
    border-transparent
    hover:bg-[var(--surface-1)]
    hover:text-[var(--brand-primary)]
    active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-150
  `,
  destructive: `
    bg-[var(--state-error)] 
    text-white 
    border-[var(--state-error)]
    theme-btn
    hover:opacity-90
    active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[0.75rem] rounded-[var(--radius-sm)]',
  md: 'h-10 px-4 text-[0.875rem] rounded-[var(--radius-md)]',
  lg: 'h-12 px-6 text-[1rem] rounded-[var(--radius-md)]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className = '',
  disabled, // Destructure disabled here
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        flex items-center justify-center gap-2
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={loading || disabled} // Use disabled directly
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}