import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'default', ...props }, ref) => {
    const variants = {
      primary: 'bg-[var(--btn-primary)] text-white hover:bg-[var(--btn-primary-hover)] active:opacity-90',
      secondary: 'bg-[var(--surface-alt)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] active:bg-[var(--color-border)]',
      outline: 'border border-[var(--color-border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] active:border-[var(--accent)]',
      danger: 'bg-[var(--danger)] text-white hover:opacity-90 active:opacity-75',
      ghost: 'text-[var(--text-primary)] hover:bg-[var(--surface-alt)] active:bg-[var(--surface-hover)]',
      link: 'text-[var(--accent)] underline-offset-4 hover:underline',
    };

    const sizes = {
      default: 'h-10 px-4 py-2 rounded-lg text-sm font-medium',
      sm: 'h-8 px-3 rounded-lg text-xs font-medium',
      lg: 'h-11 px-6 rounded-lg text-base font-medium',
      icon: 'h-10 w-10 rounded-lg',
    };

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
