import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Dashboard } from './components/dashboard/Dashboard';
import { POList } from './components/po/POList';
import { PODetail } from './components/po/PODetail';
import { ReceivingForm } from './components/receiving/ReceivingForm';
import { VendorView } from './components/vendor/VendorView';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { Sidebar } from './components/layout/Sidebar';
import {
  LayoutDashboard, ShoppingBag, Truck, Users, BarChart3,
} from 'lucide-react';

const navItems = [
  { name: 'Tableau de Bord',   path: '/',                 icon: LayoutDashboard },
  { name: 'Bons de Commande',  path: '/bons-de-commande', icon: ShoppingBag },
  { name: 'Réception',         path: '/reception/1',      icon: Truck },
  { name: 'Fournisseurs',      path: '/fournisseurs',     icon: Users },
  { name: 'Analytique',        path: '/analytique',       icon: BarChart3 },
];

function AppLayout() {
  const { pathname } = useLocation();
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      <Sidebar navItems={navItems} currentPath={pathname} />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/"                  element={<Dashboard />} />
          <Route path="/bons-de-commande"  element={<POList />} />
          <Route path="/po/:id"            element={<PODetail />} />
          <Route path="/reception/:id"     element={<ReceivingForm />} />
          <Route path="/fournisseurs"      element={<VendorView />} />
          <Route path="/analytique"        element={<AnalyticsDashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}
