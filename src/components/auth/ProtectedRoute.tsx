import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function ProtectedRoute() {
  const { session, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-emerald-600"></div>
      </div>
    );
  }

  // Not logged in -> send to login page
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Logged in, but no profile or not approved -> send to pending page
  if (!profile || !profile.is_approved) {
    return <Navigate to="/pending" replace />;
  }

  // Logged in AND approved -> render the child component (the main app layout)
  return <Outlet />;
}

export function AdminRoute() {
  const { session, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-emerald-600"></div>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;
  if (!profile || !profile.is_approved) return <Navigate to="/pending" replace />;
  
  // Must explicitly be an admin
  if (profile.role !== 'admin') return <Navigate to="/" replace />; // Send normal users back to dashboard

  return <Outlet />;
}
