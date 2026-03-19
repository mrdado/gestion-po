import { useAuth } from '../../contexts/AuthContext';
import { ShieldAlert, LogOut } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export function PendingApproval() {
  const { signOut, profile } = useAuth();

  // If the user actually is approved (e.g. they manually navigated here), send them to the app
  if (profile?.is_approved) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden text-center p-8">
        
        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="h-8 w-8 text-amber-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Compte en Attente</h1>
        
        <p className="text-gray-500 mb-8 leading-relaxed">
          Bonjour <strong>{profile?.email}</strong>.<br /> 
          Votre compte a bien été créé, mais il nécessite l'approbation d'un administrateur avant de pouvoir accéder à la plateforme.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-8 text-sm text-gray-600 text-left border">
          <p className="font-semibold text-gray-700 mb-1">Que faire maintenant ?</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Contactez votre responsable d'équipe.</li>
            <li>Revenez vérifier plus tard (l'accès se débloquera automatiquement).</li>
          </ul>
        </div>

        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-lg font-medium transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>

      </div>
    </div>
  );
}
