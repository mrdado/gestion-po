import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth, type Profile } from '../../contexts/AuthContext';
import { PageHeader } from '../layout/PageHeader';
import { ShieldCheck, UserX, UserCheck, Bell, BellOff } from 'lucide-react';

export function UserManagement() {
  const { profile: currentAdminProfile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data as Profile[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();

    // Listen for realtime profile changes (new signups or approvals from other admins)
    const channel = supabase.channel('profiles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (_payload) => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleApproval = async (id: string, currentStatus: boolean) => {
    await supabase
      .from('profiles')
      .update({ is_approved: !currentStatus })
      .eq('id', id);
    // Optimistic UI update
    setUsers(users.map(u => u.id === id ? { ...u, is_approved: !currentStatus } : u));
  };

  const toggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', id);
    setUsers(users.map(u => u.id === id ? { ...u, role: newRole as 'admin' | 'user' } : u));
  };

  const updateName = async (id: string, newName: string) => {
    await supabase
      .from('profiles')
      .update({ full_name: newName })
      .eq('id', id);
    setUsers(users.map(u => u.id === id ? { ...u, full_name: newName } : u));
  };

  const toggleNotifications = async (id: string, currentStatus: boolean) => {
    const newValue = !currentStatus;
    await supabase
      .from('profiles')
      .update({ receive_email_notifications: newValue })
      .eq('id', id);
    setUsers(users.map(u => u.id === id ? { ...u, receive_email_notifications: newValue } : u));
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        title="Gestion des Utilisateurs"
        subtitle="Approuvez, révoquez ou modifiez les rôles des utilisateurs de la plateforme."
        hideSearch={true}
      />

      <div className="px-8 flex flex-col gap-5">
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                {['Utilisateur', 'Rôle', 'Statut', 'Alertes Email', 'Actions'].map(h => (
                  <th key={h} className={`px-5 py-4 text-xs font-semibold uppercase tracking-wider text-left`} style={{ color: 'var(--text-tertiary)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">Chargement...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">Aucun utilisateur trouvé.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b transition-colors hover:bg-gray-50" style={{ borderColor: 'var(--border)' }}>
                    
                    {/* Utilisateur */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {user.full_name || '-'}
                          </span>
                          <button 
                            className="text-xs text-blue-600 hover:underline"
                            onClick={() => {
                              const newName = prompt('Nom complet:', user.full_name || '');
                              if (newName !== null) updateName(user.id, newName);
                            }}
                          >
                            Modifier
                          </button>
                        </div>
                        <span className="text-gray-500 text-xs">{user.email}</span>
                        {user.id === currentAdminProfile?.id && (
                          <span className="text-xs text-gray-400 font-normal">(Vous)</span>
                        )}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                        {user.role === 'admin' && <ShieldCheck className="w-3 h-3 mr-1" />}
                        {user.role.toUpperCase()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      {user.is_approved ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Approuvé
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          En Attente
                        </span>
                      )}
                    </td>

                    {/* Email Notifications */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleNotifications(user.id, user.receive_email_notifications)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          user.receive_email_notifications 
                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {user.receive_email_notifications ? (
                          <><Bell className="w-3.5 h-3.5" /> Activées</>
                        ) : (
                          <><BellOff className="w-3.5 h-3.5" /> Désactivées</>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {/* Approval Toggle */}
                        {user.id !== currentAdminProfile?.id && (
                          <button
                            onClick={() => toggleApproval(user.id, user.is_approved)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                              user.is_approved 
                                ? 'bg-red-50 text-red-700 hover:bg-red-100' 
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {user.is_approved ? (
                              <><UserX className="w-3.5 h-3.5" /> Révoquer</>
                            ) : (
                              <><UserCheck className="w-3.5 h-3.5" /> Approuver</>
                            )}
                          </button>
                        )}
                        
                        {/* Role Toggle */}
                        {user.id !== currentAdminProfile?.id && (
                          <button
                            onClick={() => toggleRole(user.id, user.role)}
                            className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-2"
                          >
                            Rendre {user.role === 'admin' ? 'User' : 'Admin'}
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
