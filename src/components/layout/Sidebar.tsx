import { Link } from 'react-router-dom';
import { Settings, Move } from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  navItems: NavItem[];
  currentPath: string;
}

export function Sidebar({ navItems, currentPath }: SidebarProps) {
  return (
    <div
      className="flex flex-col items-center py-5 gap-3 shrink-0"
      style={{ width: 72, backgroundColor: 'transparent' }}
    >
      {/* Brand logo — floating, no background */}
      <div className="w-10 h-10 flex items-center justify-center mb-1">
        <Move className="h-6 w-6" style={{ color: 'var(--accent)' }} />
      </div>

      {/* White nav card wrapping all navigation icons */}
      <div
        className="flex flex-col items-center gap-1 py-3 px-1.5 flex-1"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}
      >
        {navItems.map(({ name, path, icon: Icon }) => {
          const isActive = currentPath === path || (path !== '/' && currentPath.startsWith(path));
          return (
            <Link
              key={path}
              to={path}
              title={name}
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors"
              style={{ backgroundColor: isActive ? '#2E3147' : 'transparent' }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.05)'; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
            </Link>
          );
        })}
      </div>

      {/* Bottom: settings + avatar — outside the white card */}
      <div className="flex flex-col items-center gap-3 mt-1">
        <Link
          to="/parametres"
          title="Paramètres"
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-black/5"
        >
          <Settings className="h-5 w-5 text-gray-400" />
        </Link>
        <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center cursor-pointer">
          <span className="text-white text-xs font-bold">JD</span>
        </div>
      </div>
    </div>
  );
}
