import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { PageHeader } from '../layout/PageHeader';

const cycleData = [
  { mois: 'Jan', jours: 14 }, { mois: 'Fev', jours: 12 },
  { mois: 'Mar', jours: 15 }, { mois: 'Avr', jours: 10 },
  { mois: 'Mai', jours: 9  }, { mois: 'Juin', jours: 8 },
];

const spendData = [
  { fournisseur: 'Tech Solutions', montant: 45000 },
  { fournisseur: 'Global Logistics', montant: 32000 },
  { fournisseur: 'Office Supplies', montant: 15000 },
  { fournisseur: 'Consulting Pro', montant: 25000 },
];

function KpiCard({ title, value, unit, change, positive }: {
  title: string; value: string; unit: string; change: string; positive: boolean;
}) {
  return (
    <div className="card p-5">
      <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{title}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</span>
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{unit}</span>
      </div>
      <p className="flex items-center gap-1 text-xs font-semibold mt-2"
        style={{ color: positive ? '#16A34A' : '#DC2626' }}>
        {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {change}
      </p>
    </div>
  );
}

export function AnalyticsDashboard() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        title="Analytique & KPIs"
        subtitle="Suivez les performances des bons de commande et des fournisseurs"
        searchPlaceholder="Rechercher..."
      />

      <div className="px-8 flex flex-col gap-6">
        <div className="grid grid-cols-3 gap-5">
          <KpiCard title="Durée Moyenne de Cycle" value="8,5" unit="jours" change="-1,5 j vs mois dernier" positive={true} />
          <KpiCard title="Taux de Conformité" value="94" unit="%" change="Objectif : 95%" positive={true} />
          <KpiCard title="Exceptions (Mois)" value="12" unit="" change="+3 cas vs mois dernier" positive={false} />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="card p-5">
            <h3 className="font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Durée de Cycle par Mois</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={cycleData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F1EC" vertical={false} />
                <XAxis dataKey="mois" stroke="#9CA3AF" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} formatter={(v) => [`${v} jours`, 'Durée']} />
                <Line type="monotone" dataKey="jours" stroke="#5BA07A" strokeWidth={2.5} dot={{ fill: '#5BA07A', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Dépenses par Fournisseur</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={spendData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F1EC" vertical={false} />
                <XAxis dataKey="fournisseur" stroke="#9CA3AF" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} formatter={(v) => [`${Number(v).toLocaleString('fr-FR')} €`, 'Montant']} />
                <Bar dataKey="montant" fill="#B5D5C5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
