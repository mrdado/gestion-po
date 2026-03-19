import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Package } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  
  const { session } = useAuth();

  // If already logged in, redirect to the main app (ProtectedRoute will handle /pending logic)
  if (session) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // ProtectedRoute will auto-redirect us to / or /pending
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        setMessage({
          text: 'Compte créé ! Veuillez vous connecter. (Votre compte devra être approuvé avant accès).',
          isError: false
        });
        setIsLogin(true); // Switch back to login view
      }
    } catch (error: any) {
      setMessage({ text: error.message, isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 pb-6 bg-[#000] text-white flex flex-col items-center justify-center">
          <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
            <Package className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion PO</h1>
          <p className="text-sm text-gray-400 mt-1 text-center">
            Système interne de gestion des bons de commande
          </p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            {isLogin ? 'Bon retour' : 'Création de compte'}
          </h2>

          {message && (
            <div className={`mb-6 p-3 rounded-lg text-sm ${message.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-emerald-800 border border-emerald-200'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email professionnel</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="vous@entreprise.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white p-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isLogin ? (
                'Se connecter'
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

            <div className="mt-6 text-center text-sm text-gray-500">
            {isLogin ? (
              <>
                Pas encore de compte ?{' '}
                <button onClick={() => { setIsLogin(false); setMessage(null); }} className="text-black font-semibold hover:underline">
                  S'inscrire
                </button>
              </>
            ) : (
                <>
                Déjà un compte ?{' '}
                <button onClick={() => { setIsLogin(true); setMessage(null); }} className="text-black font-semibold hover:underline">
                  Se connecter
                </button>
              </>
            )}
            </div>
        </div>
      </div>
    </div>
  );
}
