import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { FileText, Clock, DollarSign, MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';
import { PageHeader } from '../layout/PageHeader';

/* ── mock data ───────────────────────────────────── */
const spendData = [
  { jour: 'Lun', montant: 2500 },
  { jour: 'Mar', montant: 3800 },
  { jour: 'Mer', montant: 2200 },
  { jour: 'Jeu', montant: 4090 },
  { jour: 'Ven', montant: 1800 },
  { jour: 'Sam', montant: 3200 },
  { jour: 'Dim', montant: 2900 },
];

const breakdown = [
  { name: 'Approuvé',   value: 40, color: '#B5D5C5' },
  { name: 'En Attente', value: 25, color: '#D4C5B0' },
  { name: 'Rejeté',     value: 15, color: '#F7C5A8' },
  { name: 'Clôturé',    value: 20, color: '#C8D5E0' },
];

const recentPOs = [
  { label: 'MacBook Pro 14" (Dpt. IT)',       date: '12 Sep 2024, 9h29', amount: '30K€', bg: '#E8F0EC' },
  { label: 'Mobilier de Bureau en Gros',      date: '10 Sep 2024, 9h29', amount: '10K€', bg: '#F0ECE8' },
];

const approvals = [
  { title: 'Nouveau Poste de Travail',    desc: 'Urgent : Extension Équipe Tech',      po: 'PO-2024-001', avatar: 'JJ', color: '#374151' },
  { title: 'Abonnements Logiciels',       desc: 'Renouvellement mensuel Marketing',    po: 'PO-2024-002', avatar: 'AF', color: '#6B7280' },
  { title: 'Maintenance des Installations', desc: 'Révision trimestrielle HVAC',       po: 'PO-2024-003', avatar: 'KW', color: '#9CA3AF' },
];

/* ── sub-components ──────────────────────────────── */
function KpiCard({ icon: Icon, iconBg, title, value, trend, trendUp, sub }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconBg: string; title: string; value: string;
  trend: string; trendUp: boolean; sub: string;
}) {
  return (
    <div className="card p-5 flex flex-col gap-3 relative">
      <button className="absolute top-4 right-4 text-gray-300 hover:text-gray-500">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: iconBg }}>
        <Icon className="h-5 w-5" style={{ color: 'var(--accent)' }} />
      </div>
      <div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{title}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</span>
          <span
            className="flex items-center gap-0.5 text-xs font-semibold"
            style={{ color: trendUp ? '#16A34A' : '#DC2626' }}
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
  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <PageHeader
        title="Bonjour, John !"
        subtitle="Explorez les informations et l'activité de vos bons de commande"
        searchPlaceholder="Rechercher..."
      />

      <div className="px-8 flex flex-col gap-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-5">
          <KpiCard icon={FileText} iconBg="#E8F2EC" title="Bons de Commande Ouverts"
            value="1 240" trend="+20%" trendUp sub="Total mois dernier 1 050" />
          <KpiCard icon={Clock} iconBg="#EDE8F5" title="Approbations en Attente"
            value="452" trend="-20%" trendUp={false} sub="Total mois dernier 580" />
          <KpiCard icon={DollarSign} iconBg="#FEF3E2" title="Dépenses Mensuelles"
            value="1,4 M€" trend="+12%" trendUp sub="Total mois dernier 1,25 M€" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-3 gap-5">
          {/* Spend Analysis */}
          <div className="card col-span-2 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Analyse des Dépenses</h3>
              <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white" style={{ color: 'var(--text-secondary)' }}>
                <option>Hebdomadaire</option>
                <option>Mensuel</option>
                <option>Annuel</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={spendData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F1EC" vertical={false} />
                <XAxis dataKey="jour" stroke="#9CA3AF" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
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
              <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Répartition des BC</h3>
              <button className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Voir Détails</button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={breakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
                    {breakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <p className="text-xl font-bold -mt-2" style={{ color: 'var(--text-primary)' }}>4 750 €</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>VALEUR TOTALE</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {breakdown.map((b, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{b.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent POs + Priority Approvals */}
        <div className="grid grid-cols-2 gap-5">
          {/* Recent POs */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>BC Récents</h3>
              <button className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Voir Tout</button>
            </div>
            <div className="flex flex-col gap-3">
              {recentPOs.map((po, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-alt)' }}>
                  <div className="w-10 h-10 rounded-lg shrink-0" style={{ backgroundColor: po.bg }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{po.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{po.date}</p>
                  </div>
                  <span className="text-sm font-bold shrink-0" style={{ color: 'var(--text-primary)' }}>{po.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Approvals */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Approbations Prioritaires</h3>
              <button className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Voir Tout</button>
            </div>
            <div className="flex flex-col divide-y divide-gray-100">
              {approvals.map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center" style={{ backgroundColor: 'var(--surface-alt)' }}>
                    <FileText className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{a.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{a.po}</span>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: a.color }}>
                      {a.avatar}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
