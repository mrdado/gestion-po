import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
      destructive: 'bg-destructive text-white hover:bg-destructive/90 active:bg-destructive/80',
      outline: 'border border-border bg-surface text-text-primary hover:bg-surface-secondary active:bg-border',
      secondary: 'bg-surface-secondary text-text-primary hover:bg-border active:bg-border',
      ghost: 'text-text-primary hover:bg-surface-secondary active:bg-border',
      link: 'text-primary underline-offset-4 hover:underline',
    };

    const sizes = {
      default: 'h-10 px-4 py-2 rounded-md text-sm font-medium',
      sm: 'h-8 px-3 rounded-md text-sm font-medium',
      lg: 'h-11 px-6 rounded-md text-base font-medium',
      icon: 'h-10 w-10 rounded-md',
    };

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
