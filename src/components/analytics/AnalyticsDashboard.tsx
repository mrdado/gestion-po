import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Loader2, Package, Truck, 
  ShoppingCart, CreditCard, ClipboardCheck, ArrowUpRight,
  Award, AlertTriangle, ListOrdered
} from 'lucide-react';
import { PageHeader } from '../layout/PageHeader';
import { supabase } from '../../lib/supabase';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6', '#14B8A6'];
const STATUS_COLORS: any = {
  'Commandé': '#3B82F6',
  'Partiel': '#F59E0B',
  'Reçu': '#10B981',
  'Facturé': '#8B5CF6',
  'Payé': '#14B8A6'
};

function KpiCard({ title, value, unit, change, positive, icon: Icon, color }: {
  title: string; value: string | number; unit: string; change: string; positive: boolean; icon: any; color: string;
}) {
  return (
    <div className="card p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-[0.03] rotate-12 transition-transform group-hover:scale-110`} style={{ color }}>
        <Icon size={96} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15`, color }}>
            <Icon size={18} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-slate-900">{value}</span>
          <span className="text-sm font-medium text-slate-500">{unit}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {change.includes('%') || change.includes('vs') ? change : `+${change}`}
          </div>
          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">vs mois dernier</span>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    pos: [] as any[],
    items: [] as any[],
    vendors: [] as any[],
    stats: {
      totalSpend: 0,
      monthlySpend: 0,
      complianceRate: 0,
      activePOs: 0,
      spendByVendor: [] as any[],
      spendByProject: [] as any[],
      statusFunnel: [] as any[],
      topItems: [] as any[],
      vendorPerformance: [] as any[],
      monthlySpendTrend: [] as any[]
    }
  });

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('analytics-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_orders' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'po_items' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [posRes, itemsRes, vendorsRes] = await Promise.all([
        supabase.from('purchase_orders').select('*, vendor:vendors(name)'),
        supabase.from('po_items').select('*'),
        supabase.from('vendors').select('*')
      ]);

      if (posRes.error) throw posRes.error;
      
      const pos = posRes.data || [];
      const items = itemsRes.data || [];
      const vendors = vendorsRes.data || [];

      processAllStats(pos, items, vendors);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const processAllStats = (pos: any[], items: any[], vendors: any[]) => {
    // 1. Spend by Vendor
    const vendorMap = new Map();
    pos.forEach(po => {
      const name = po.vendor?.name || 'Inconnu';
      vendorMap.set(name, (vendorMap.get(name) || 0) + Number(po.total_amount));
    });
    const spendByVendor = Array.from(vendorMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // 2. Spend by Project
    const projectMap = new Map();
    pos.forEach(po => {
      const proj = po.project_number || 'Non assigné';
      projectMap.set(proj, (projectMap.get(proj) || 0) + Number(po.total_amount));
    });
    const spendByProject = Array.from(projectMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // 3. Status Funnel
    const funnel = ['Commandé', 'Partiel', 'Reçu', 'Facturé', 'Payé'].map(s => ({
      name: s,
      value: pos.filter(p => p.status === s).length
    }));

    // 4. Top Articles
    const itemMap = new Map();
    items.forEach(item => {
      const desc = item.description;
      const current = itemMap.get(desc) || { count: 0, total: 0 };
      itemMap.set(desc, { 
        count: current.count + Number(item.quantity_ordered),
        total: current.total + (Number(item.quantity_ordered) * Number(item.unit_price))
      });
    });
    const topItems = Array.from(itemMap.entries())
      .map(([name, data]) => ({ name, count: data.count, total: data.total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // 5. Vendor Performance (On-time Service Rate)
    const vPerf = vendors.map(v => {
      const vPOs = pos.filter(p => p.vendor_id === v.id && (p.status === 'Reçu' || p.status === 'Facturé' || p.status === 'Payé'));
      if (vPOs.length === 0) return { name: v.name, rate: 100, pos: 0 };
      
      const onTime = vPOs.filter(p => {
        if (!p.expected_delivery_date) return true;
        return parseISO(p.updated_at) <= parseISO(p.expected_delivery_date);
      }).length;
      
      return { name: v.name, rate: Math.round((onTime / vPOs.length) * 100), pos: vPOs.length };
    }).sort((a, b) => b.rate - a.rate).slice(0, 5);

    // 6. Monthly Trend
    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const start = startOfMonth(subMonths(new Date(), i));
      const end = endOfMonth(subMonths(new Date(), i));
      const val = pos
        .filter(p => isWithinInterval(parseISO(p.created_at), { start, end }))
        .reduce((sum, p) => sum + Number(p.total_amount), 0);
      trend.push({ name: format(start, 'MMM', { locale: fr }), value: val });
    }

    // Overall metrics
    const currentMonthSpend = trend[5].value;

    const compliance = pos.filter(p => (p.status === 'Reçu' || p.status === 'Facturé' || p.status === 'Payé')).length > 0
      ? Math.round((pos.filter(p => {
          if (!['Reçu', 'Facturé', 'Payé'].includes(p.status)) return false;
          if (!p.expected_delivery_date) return true;
          return parseISO(p.updated_at) <= parseISO(p.expected_delivery_date);
        }).length / pos.filter(p => ['Reçu', 'Facturé', 'Payé'].includes(p.status)).length) * 100)
      : 100;

    setData({
      pos, items, vendors,
      stats: {
        totalSpend: pos.reduce((s, p) => s + Number(p.total_amount), 0),
        monthlySpend: currentMonthSpend,
        complianceRate: compliance,
        activePOs: pos.filter(p => p.status === 'Commandé' || p.status === 'Partiel').length,
        spendByVendor,
        spendByProject,
        statusFunnel: funnel,
        topItems,
        vendorPerformance: vPerf,
        monthlySpendTrend: trend
      }
    });
  };

  if (loading && data.pos.length === 0) {
    return (
      <div className="flex h-[600px] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        <p className="text-slate-500 font-medium animate-pulse">Chargement de vos analyses...</p>
      </div>
    );
  }

  const { stats } = data;

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-700">
      <PageHeader
        title="Tableau de Bord KPI"
        subtitle="Analyses stratégiques et performance opérationnelle"
        searchPlaceholder="Filtrer les stats..."
        actions={
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Mise à jour directe</span>
            <button 
              onClick={fetchData} 
              className="p-2 bg-white text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all hover:rotate-180 duration-500 shadow-sm"
              title="Actualiser les données"
            >
              <Loader2 size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        }
      />

      <div className="px-8 flex flex-col gap-8">
        {/* Top KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard 
            title="Dépenses Totales" 
            value={stats.totalSpend.toLocaleString('fr-FR')} 
            unit="€" 
            change={`${stats.monthlySpend.toLocaleString('fr-FR')} € ce mois`}
            positive={true}
            icon={CreditCard}
            color="#10B981"
          />
          <KpiCard 
            title="Taux de Service" 
            value={stats.complianceRate} 
            unit="%" 
            change={`${stats.complianceRate >= 95 ? 'Excellent' : 'À surveiller'}`}
            positive={stats.complianceRate >= 95}
            icon={Truck}
            color="#3B82F6"
          />
          <KpiCard 
            title="Commandes Actives" 
            value={stats.activePOs} 
            unit="POs" 
            change={data.pos.filter(p => p.status === 'Partiel').length.toString() + ' Partielles'}
            positive={true}
            icon={ShoppingCart}
            color="#F59E0B"
          />
          <KpiCard 
            title="Projets Actifs" 
            value={stats.spendByProject.length} 
            unit="Prop." 
            change="Volume d'affaires"
            positive={true}
            icon={Package}
            color="#6366F1"
          />
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Expenditure Trend */}
          <div className="xl:col-span-2 card p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Évolution des Dépenses</h3>
                <p className="text-xs text-slate-500">Montant total des commandes sur les 6 derniers mois</p>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <TrendingUp size={20} />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.monthlySpendTrend}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k€`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  formatter={(v) => [`${Number(v).toLocaleString('fr-FR')} €`, 'Dépense']}
                />
                <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorSpend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Status Funnel */}
          <div className="card p-6 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Entonnoir de Commande</h3>
                <p className="text-xs text-slate-500">Flux de travail des bons de commande</p>
              </div>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <ListOrdered size={20} />
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-around gap-4">
              {stats.statusFunnel.map((item, index) => (
                <div key={item.name} className="group cursor-default">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{item.name}</span>
                    <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">{item.value}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                    <div 
                      className="h-full transition-all duration-1000 ease-out group-hover:brightness-110"
                      style={{ 
                        width: `${Math.max(4, (item.value / Math.max(...stats.statusFunnel.map(f => f.value), 1)) * 100)}%`,
                        backgroundColor: STATUS_COLORS[item.name] || COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Secondary Insights Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Expend by Vendor */}
          <div className="card p-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Award size={18} className="text-emerald-500" />
              Top Fournisseurs (Dépenses)
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.spendByVendor} layout="vertical" margin={{ left: -10, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#64748B" tick={{ fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} />
                <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Articles */}
          <div className="card p-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Package size={18} className="text-blue-500" />
              Articles les plus Commandés
            </h3>
            <div className="space-y-4">
              {stats.topItems.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-100 italic">
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate capitalize">{item.name.toLowerCase()}</p>
                    <p className="text-[10px] text-slate-400">{item.count} unités commandées</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-800">{Math.round(item.total).toLocaleString('fr-FR')} €</p>
                  </div>
                </div>
              ))}
              {stats.topItems.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                  <AlertTriangle size={24} />
                  <p className="text-xs italic">Aucune donnée d'article trouvée</p>
                </div>
              )}
            </div>
          </div>

          {/* Vendor Service Rate */}
          <div className="card p-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
              <ClipboardCheck size={18} className="text-emerald-500" />
              Performance Fournisseur
            </h3>
            <div className="space-y-4">
              {stats.vendorPerformance.map((v) => (
                <div key={v.name} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-700">{v.name}</span>
                      <span className={`text-[10px] font-bold ${v.rate >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {v.rate}% à temps
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full">
                      <div 
                        className={`h-full rounded-full ${v.rate >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${v.rate}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-[10px] font-medium text-slate-400 w-12 text-right">
                    {v.pos} POs
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Project Distribution */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ClipboardCheck size={18} className="text-indigo-500" />
              Répartition par Projet / Affaire
            </h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[10px] font-bold text-indigo-700 uppercase">{stats.spendByProject.length} Projets</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.spendByProject.map((proj, idx) => (
              <div key={proj.name} className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-slate-400 tracking-tighter italic">AFF#{idx + 1}</span>
                  <ArrowUpRight size={14} className="text-slate-300" />
                </div>
                <p className="text-xs font-black text-slate-800 mb-1 truncate" title={proj.name}>{proj.name}</p>
                <p className="text-lg font-black text-indigo-600">{Math.round(proj.value).toLocaleString('fr-FR')} €</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
