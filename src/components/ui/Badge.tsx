import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'delivered' | 'processing' | 'shipped' | 'cancelled' | 'pending' | 'active' | 'onboarding';
}

export function Badge({ className = '', variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-primary/10 text-primary border border-primary/20',
    secondary: 'bg-surface-secondary text-text-secondary border border-border',
    destructive: 'bg-destructive/10 text-destructive border border-destructive/20',
    outline: 'border border-border text-text-primary bg-surface',
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    info: 'bg-info/10 text-info border border-info/20',
    delivered: 'bg-green-100 text-green-800',
    processing: 'bg-amber-100 text-amber-800',
    shipped: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
    pending: 'bg-amber-100 text-amber-800',
    active: 'bg-green-100 text-green-800',
    onboarding: 'bg-amber-100 text-amber-800',
  };

  return (
    <div
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
