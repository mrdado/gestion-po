import { Search, Bell, MessageSquare, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  searchPlaceholder?: string;
  backLink?: { label: string; to: string };
  actions?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  searchPlaceholder = 'Rechercher...',
  backLink,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between px-8 pt-6 pb-5" style={{ backgroundColor: 'var(--bg)' }}>
      <div>
        {backLink && (
          <Link
            to={backLink.to}
            className="flex items-center gap-1 text-sm mb-2 hover:underline"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {backLink.label}
          </Link>
        )}
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
        {subtitle && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3 mt-1">
        {actions}
        {/* Search */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <Search className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="bg-transparent outline-none w-44 text-sm"
            style={{ color: 'var(--text-primary)' }}
          />
          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--btn-primary)' }}>
            <Search className="h-3 w-3 text-white" />
          </div>
        </div>
        {/* Chat */}
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center border transition-colors hover:bg-gray-100"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <MessageSquare className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
        </button>
        {/* Bell */}
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center border transition-colors hover:bg-gray-100"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <Bell className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>
    </div>
  );
}
