import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' 
    | 'commandé' | 'partiel' | 'reçu' | 'facturé' | 'payé'
    | 'actif' | 'integration';
}

export function Badge({ className = '', variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[var(--info)]/10 text-[var(--info)] border border-[var(--info)]/20',
    secondary: 'bg-[var(--surface-alt)] text-[var(--text-secondary)] border border-[var(--color-border)]',
    destructive: 'bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20',
    outline: 'border border-[var(--color-border)] text-[var(--text-primary)] bg-[var(--surface)]',
    success: 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20',
    warning: 'bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20',
    info: 'bg-[var(--info)]/10 text-[var(--info)] border border-[var(--info)]/20',
    // PO Status variants
    commandé: 'bg-blue-50 text-blue-700 border border-blue-200',
    partiel: 'bg-amber-50 text-amber-700 border border-amber-200',
    reçu: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    facturé: 'bg-purple-50 text-purple-700 border border-purple-200',
    payé: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    // Vendor Status variants
    actif: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    integration: 'bg-amber-50 text-amber-700 border border-amber-200',
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
