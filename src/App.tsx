import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Dashboard } from './components/dashboard/Dashboard';
import { POList } from './components/po/POList';
import { PODetail } from './components/po/PODetail';
import { ReceptionList } from './components/receiving/ReceptionList';
import { ReceivingForm } from './components/receiving/ReceivingForm';
import { VendorView } from './components/vendor/VendorView';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { POEntry } from './components/po-entry/POEntry';
import { Sidebar } from './components/layout/Sidebar';
import { LayoutDashboard, ShoppingBag, Truck, Users, BarChart3, ShieldCheck } from 'lucide-react';

/* Auth Components */
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/auth/ProtectedRoute';
import { Login } from './components/auth/Login';
import { PendingApproval } from './components/auth/PendingApproval';
import { UserManagement } from './components/admin/UserManagement';

function AppLayout() {
  const { pathname } = useLocation();
  const { profile } = useAuth();
  
  // Base navigation items
  const navItems = [
    { name: 'Tableau de Bord',   path: '/',                 icon: LayoutDashboard },
    { name: 'Bons de Commande',  path: '/bons-de-commande', icon: ShoppingBag },
    { name: 'Réceptions',        path: '/receptions',       icon: Truck },
    { name: 'Fournisseurs',      path: '/fournisseurs',     icon: Users },
    { name: 'Analytique',        path: '/analytique',       icon: BarChart3 },
  ];

  // Append Admin nav item if user is an admin
  if (profile?.role === 'admin') {
    navItems.push({ name: 'Admin Utilisateurs', path: '/admin/users', icon: ShieldCheck });
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      <Sidebar navItems={navItems} currentPath={pathname} />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          {/* Protected Main Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/"                  element={<Dashboard />} />
            <Route path="/bons-de-commande"  element={<POList />} />
            <Route path="/bons-de-commande/nouveau" element={<POEntry />} />
            <Route path="/po/modifier/:id"   element={<POEntry />} />
            <Route path="/po/:id"            element={<PODetail />} />
            <Route path="/receptions"        element={<ReceptionList />} />
            <Route path="/reception/:id"     element={<ReceivingForm />} />
            <Route path="/fournisseurs"      element={<VendorView />} />
            <Route path="/analytique"        element={<AnalyticsDashboard />} />
          </Route>

          {/* Admin Only Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/users"       element={<UserManagement />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/pending" element={<PendingApproval />} />
          
          {/* Protected Layout Route (catches everything else) */}
          <Route path="*" element={<AppLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
