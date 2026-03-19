import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  subDays, subWeeks, subMonths, subYears,
  format, isSameDay, isSameWeek, isSameMonth, isSameYear
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, DollarSign, TrendingUp, TrendingDown, Loader2, ChevronDown, Truck } from 'lucide-react';
import { PageHeader } from '../layout/PageHeader';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

/* ── sub-components ──────────────────────────────── */
function KpiCard({ icon: Icon, iconBgVar, title, value, trend, trendUp, sub }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconBgVar: string; title: string; value: string;
  trend: string; trendUp: boolean; sub: string;
}) {
  return (
    <div className="card p-5 flex flex-col gap-3 relative">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `var(${iconBgVar})` }}>
        <Icon className="h-5 w-5" style={{ color: 'var(--accent)' }} />
      </div>
      <div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{title}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</span>
          <span
            className="flex items-center gap-0.5 text-xs font-semibold"
            style={{ color: trendUp ? 'var(--trend-up)' : 'var(--trend-down)' }}
            aria-label={`${trendUp ? 'Tendance à la hausse' : 'Tendance à la baisse'}: ${trend}`}
          >
            {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend}
          </span>
        </div>
      </div>
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>
    </div>
  );
}

/* ── main component ──────────────────────────────── */
export function Dashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    openCount: 0,
    pendingReceptions: 0,
    monthlySpend: 0,
    openTrend: '+0%',
    billedTrend: '+0%',
    spendTrend: '+0%',
  });
  const [allPOsForCalculations, setAllPOsForCalculations] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<'days' | 'weeks' | 'months' | 'years'>('days');
  const [hasMorePOs, setHasMorePOs] = useState(false);

  // Memoized currency formatter (Issue #10)
  const formatCurrency = useCallback((val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)} M€`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)} K€`;
    return `${val.toLocaleString('fr-FR')} €`;
  }, []);

  useEffect(() => {
    fetchData();
  }, [timeframe]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch POs with pagination (Issue #3: limit to 100 instead of all)
      const { data: allPOs, error } = await supabase
        .from('purchase_orders')
        .select('*, vendors(name)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (allPOs) {
        setAllPOsForCalculations(allPOs);
        setHasMorePOs(allPOs.length > 5);
        
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        
        // Filter for this month and last month
        const thisMonthPOs = allPOs.filter(po => new Date(po.created_at) >= startOfMonth);
        const lastMonthPOs = allPOs.filter(po => {
          const d = new Date(po.created_at);
          return d >= startOfLastMonth && d < startOfMonth;
        });
        
        const monthlyTotal = thisMonthPOs.reduce((sum, po) => sum + Number(po.total_amount), 0);
        const lastMonthTotal = lastMonthPOs.reduce((sum, po) => sum + Number(po.total_amount), 0);
        
        // Status Counts
        // "Commande en cours" includes everything except "Payé"
        const open = allPOs.filter(po => po.status !== 'Payé').length;
        const lastMonthOpen = lastMonthPOs.filter(po => po.status !== 'Payé').length;
        const billed = allPOs.filter(po => po.status === 'Facturé' || po.status === 'Payé').length;
        const lastMonthBilled = lastMonthPOs.filter(po => po.status === 'Facturé' || po.status === 'Payé').length;
        
        // Calculate real trends (Issue #15)
        const openTrend = lastMonthOpen > 0 ? `${Math.round(((open - lastMonthOpen) / lastMonthOpen) * 100)}%` : '+0%';
        const billedTrend = lastMonthBilled > 0 ? `${Math.round(((billed - lastMonthBilled) / lastMonthBilled) * 100)}%` : '+0%';
        const spendTrend = lastMonthTotal > 0 ? `${Math.round(((monthlyTotal - lastMonthTotal) / lastMonthTotal) * 100)}%` : '+0%';
        
        setStats({
          openCount: open,
          pendingReceptions: allPOs.filter(po => po.status === 'Commandé' || po.status === 'Partiel').length,
          monthlySpend: monthlyTotal,
          openTrend: openTrend.startsWith('-') ? openTrend : `+${openTrend}`,
          billedTrend: billedTrend.startsWith('-') ? billedTrend : `+${billedTrend}`,
          spendTrend: spendTrend.startsWith('-') ? spendTrend : `+${spendTrend}`,
        });

        // 2. Breakdown for Pie Chart (Issue #9: no need to setStatusBreakdown, will use useMemo)

        // 3. Spend History based on timeframe (Issue #9: will use useMemo)
      }

    } catch (err) {
      console.error("Dashboard calculation error:", err);
    } finally {
      setLoading(false);
    }
  };



  // Memoized status breakdown (Issue #9)
  const statusBreakdown = useMemo(() => {
    const statuses = ['Commandé', 'Reçu', 'Facturé', 'Payé'];
    const statusColors: any = {
      'Commandé': '#A0C4FF',
      'Reçu': '#B5D5C5',
      'Facturé': '#D4C5B0',
      'Payé': '#C8D5E0'
    };

    return statuses.map(s => ({
      name: s,
      value: allPOsForCalculations.filter(po => po.status === s).length,
      color: statusColors[s]
    })).filter(item => item.value > 0);
  }, [allPOsForCalculations]);

  // Memoized total value (Issue #9)
  const totalValue = useMemo(() => {
    return allPOsForCalculations.reduce((sum, po) => sum + Number(po.total_amount), 0);
  }, [allPOsForCalculations]);

  // Memoized spend history (Issue #9)
  const spendHistory = useMemo(() => {
    const now = new Date();
    let history: any[] = [];

    if (timeframe === 'days') {
      // Last 7 days
      history = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(now, 6 - i);
        const label = format(date, 'eee', { locale: fr });
        const amount = allPOsForCalculations
          .filter(po => isSameDay(new Date(po.created_at), date))
          .reduce((sum, po) => sum + Number(po.total_amount), 0);
        return { jour: label, montant: amount };
      });
    } else if (timeframe === 'weeks') {
      // Last 5 weeks
      history = Array.from({ length: 5 }, (_, i) => {
        const date = subWeeks(now, 4 - i);
        const label = `Sem ${format(date, 'w')}`;
        const amount = allPOsForCalculations
          .filter(po => isSameWeek(new Date(po.created_at), date, { weekStartsOn: 1 }))
          .reduce((sum, po) => sum + Number(po.total_amount), 0);
        return { jour: label, montant: amount };
      });
    } else if (timeframe === 'months') {
      // Last 6 months
      history = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(now, 5 - i);
        const label = format(date, 'MMM', { locale: fr });
        const amount = allPOsForCalculations
          .filter(po => isSameMonth(new Date(po.created_at), date))
          .reduce((sum, po) => sum + Number(po.total_amount), 0);
        return { jour: label, montant: amount };
      });
    } else if (timeframe === 'years') {
      // Last 3 years
      history = Array.from({ length: 3 }, (_, i) => {
        const date = subYears(now, 2 - i);
        const label = format(date, 'yyyy');
        const amount = allPOsForCalculations
          .filter(po => isSameYear(new Date(po.created_at), date))
          .reduce((sum, po) => sum + Number(po.total_amount), 0);
        return { jour: label, montant: amount };
      });
    }

    return history;
  }, [timeframe, allPOsForCalculations]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <p className="mt-4 text-sm text-gray-500 font-medium">Initialisation du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <PageHeader
        title={`Bonjour, ${profile?.email?.split('@')[0] || 'Utilisateur'} !`}
        subtitle="Explorez les informations et l'activité de vos bons de commande"
        searchPlaceholder="Rechercher..."
      />

      <div className="px-8 flex flex-col gap-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-5">
          <KpiCard icon={FileText} iconBgVar="--icon-bg-open" title="Commandes en cours"
            value={stats.openCount.toString()} trend={stats.openTrend} trendUp sub="Dossiers non finalisés" />
          <KpiCard icon={Truck} iconBgVar="--icon-bg-pending" title="Réceptions en attente"
            value={stats.pendingReceptions.toString()} trend={stats.billedTrend} trendUp sub="Délai de livraison à surveiller" />
          <KpiCard icon={DollarSign} iconBgVar="--icon-bg-spend" title="Dépenses Mensuelles"
            value={formatCurrency(stats.monthlySpend)} trend={stats.spendTrend} trendUp sub="Commandé ce mois-ci" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-3 gap-5">
          {/* Spend Analysis */}
          <div className="card col-span-2 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Analyse des Dépenses</h3>
              <div className="relative">
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as any)}
                  aria-label="Sélectionner la période d'analyse"
                  className="appearance-none text-[11px] font-bold py-1.5 pl-3 pr-8 rounded-lg outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-offset-2 transition-all cursor-pointer uppercase tracking-tight"
                  style={{
                    backgroundColor: 'var(--surface-alt)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--text-secondary)',
                    outlineColor: 'var(--accent)',
                  }}
                >
                  <option value="days">Jours</option>
                  <option value="weeks">Semaines</option>
                  <option value="months">Mois</option>
                  <option value="years">Années</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: 'var(--text-tertiary)' }} />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={spendHistory} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F1EC" vertical={false} />
                <XAxis dataKey="jour" stroke="#9CA3AF" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v)} />
                <Tooltip
                  formatter={(v) => [`${Number(v).toLocaleString('fr-FR')} €`, 'Montant']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
                />
                <Bar dataKey="montant" fill="#B5D5C5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* PO Breakdown */}
          <div className="card p-5 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Répartition par Statut</h3>
              <Link to="/bons-de-commande" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Voir Tout</Link>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
                    {statusBreakdown.map((e, index) => <Cell key={`cell-${index}`} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <p className="text-xl font-bold -mt-2" style={{ color: 'var(--text-primary)' }}>{formatCurrency(totalValue)}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>VALEUR TOTALE</p>
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
              {statusBreakdown.map((b, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.color }} aria-hidden="true" />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span className="font-medium">{b.name}</span>
                    <span style={{ color: 'var(--text-tertiary)' }}> ({b.value})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent POs */}
        <div className="grid grid-cols-1 gap-5">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>BC Récents</h3>
              {hasMorePOs && (
                <Link to="/bons-de-commande" className="text-xs font-medium hover:underline" style={{ color: 'var(--accent)' }}>Voir Tout</Link>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {allPOsForCalculations.length === 0 ? (
                <div className="py-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
                  <p className="text-sm font-medium">Aucune commande trouvée.</p>
                  <p className="text-xs mt-1">Commencez par créer votre premier bon de commande.</p>
                </div>
              ) : (
                allPOsForCalculations.slice(0, 5).map((po) => (
                  <Link to={`/po/${po.id}`} key={po.id} className="flex items-center gap-3 p-3 rounded-lg transition-colors nav-item" style={{ backgroundColor: 'var(--surface-alt)', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--surface-alt)'}>
                    <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center bg-white shadow-sm border" style={{ borderColor: 'var(--color-border)' }}>
                       <FileText className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{po.po_number} - {po.vendors?.name || 'Fournisseur inconnu'}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{new Date(po.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span className="text-sm font-bold shrink-0" style={{ color: 'var(--text-primary)' }}>{formatCurrency(Number(po.total_amount))}</span>
                  </Link>
                ))
              )}
              {allPOsForCalculations.length > 5 && (
                <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <Link to="/bons-de-commande" className="text-xs font-medium text-center block py-2 hover:underline" style={{ color: 'var(--accent)' }}>Afficher {allPOsForCalculations.length - 5} commande(s) supplémentaire(s)</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

