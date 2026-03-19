import { Link } from 'react-router-dom';
import { Settings, Move, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

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
  const { profile, signOut } = useAuth();
  
  // Extract initials from email (e.g., john.doe@... -> JD)
  const getInitials = (email?: string) => {
    if (!email) return 'U';
    const parts = email.split('@')[0].split('.');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

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
              aria-current={isActive ? 'page' : undefined}
              className={`w-11 h-11 rounded-xl flex items-center justify-center nav-item group ${
                isActive ? 'bg-sidebar' : 'hover:bg-black/5'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
            </Link>
          );
        })}
      </div>

      {/* Bottom: settings + logout + avatar */}
      <div className="flex flex-col items-center gap-3 mt-1">
        <Link
          to="/parametres"
          aria-label="Paramètres"
          title="Paramètres"
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-offset-2 nav-item"
        >
          <Settings className="h-5 w-5 text-gray-400" />
        </Link>
        <button
          onClick={() => signOut()}
          aria-label="Se déconnecter"
          title="Se déconnecter"
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-red-50 hover:text-red-600 text-gray-400 focus-visible:ring-2 focus-visible:ring-offset-2 nav-item"
        >
          <LogOut className="h-5 w-5" />
        </button>
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center select-none"
          title={profile?.email || 'Utilisateur'}
          role="img"
          aria-label={`Profil utilisateur: ${profile?.email || 'Utilisateur'}`}
          style={{ backgroundColor: profile?.role === 'admin' ? '#7C3AED' : '#FBBF24' }}
        >
          <span className="text-white text-xs font-bold">{getInitials(profile?.email)}</span>
        </div>
      </div>
    </div>
  );
}
