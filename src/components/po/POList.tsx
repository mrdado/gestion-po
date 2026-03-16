import { MoreHorizontal, Filter } from 'lucide-react';
import { PageHeader } from '../layout/PageHeader';
import { Link } from 'react-router-dom';

const pos = [
  { id: 'PO-29402', vendor: 'BuildPro Supplies',  initials: 'BP', cls: 'initials-bp', date: '12 Sep 2024', amount: '12 450,00 €', status: 'livre' },
  { id: 'PO-29403', vendor: 'Eco Solution Inc.',   initials: 'ES', cls: 'initials-es', date: '10 Sep 2024', amount: '4 750,00 €',  status: 'en-cours' },
  { id: 'PO-29404', vendor: 'Luxe Maintenance',    initials: 'LM', cls: 'initials-lm', date: '08 Sep 2024', amount: '1 200,00 €',  status: 'expedie' },
  { id: 'PO-29405', vendor: 'Ace Hardware Co.',    initials: 'AH', cls: 'initials-ah', date: '05 Sep 2024', amount: '840,00 €',    status: 'annule' },
  { id: 'PO-29406', vendor: 'Valley Services',     initials: 'VS', cls: 'initials-vs', date: '02 Sep 2024', amount: '3 120,00 €',  status: 'livre' },
];

const statusMap: Record<string, { label: string; cls: string }> = {
  'livre':    { label: 'LIVRÉ',     cls: 'badge-livre' },
  'en-cours': { label: 'EN COURS',  cls: 'badge-en-cours' },
  'expedie':  { label: 'EXPÉDIÉ',   cls: 'badge-expedie' },
  'annule':   { label: 'ANNULÉ',    cls: 'badge-annule' },
};

export function POList() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        title="Bons de Commande"
        subtitle="Gérez et suivez vos achats"
        searchPlaceholder="Rechercher BC, fournisseurs..."
      />

      <div className="px-8">
        <div className="card overflow-hidden">
          {/* Table header row */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Toutes les Commandes</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100" style={{ color: 'var(--text-secondary)' }}>124 Total</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="btn-outline">
                <Filter className="h-3.5 w-3.5" />
                Filtrer
              </button>
              <button className="btn-primary">
                + Nouveau BC
              </button>
            </div>
          </div>

          {/* Column headers */}
          <div className="grid px-6 py-3 border-b border-gray-50" style={{
            gridTemplateColumns: '160px 1fr 140px 160px 160px 48px',
            backgroundColor: 'var(--surface)',
          }}>
            {['N° BC', 'FOURNISSEUR', 'DATE', 'MONTANT', 'STATUT', ''].map(h => (
              <span key={h} className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          {pos.map(po => {
            const st = statusMap[po.status];
            return (
              <div
                key={po.id}
                className="grid items-center px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                style={{ gridTemplateColumns: '160px 1fr 140px 160px 160px 48px' }}
              >
                <Link to={`/po/${po.id}`} className="font-bold text-sm hover:underline" style={{ color: 'var(--text-primary)' }}>
                  #{po.id}
                </Link>
                <div className="flex items-center gap-2">
                  <span className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${po.cls}`}>
                    {po.initials}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{po.vendor}</span>
                </div>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{po.date}</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{po.amount}</span>
                <span className={`badge ${st.cls}`}>{st.label}</span>
                <button className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors">
                  <MoreHorizontal className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
                </button>
              </div>
            );
          })}

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Affichage 1-10 sur 124 résultats</span>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-sm hover:bg-gray-50 transition-colors" style={{ color: 'var(--text-secondary)' }}>‹</button>
              {[1, 2, 3].map(p => (
                <button
                  key={p}
                  className="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
                  style={p === 1
                    ? { backgroundColor: 'var(--btn-primary)', color: '#fff' }
                    : { color: 'var(--text-secondary)' }}
                >
                  {p}
                </button>
              ))}
              <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-sm hover:bg-gray-50 transition-colors" style={{ color: 'var(--text-secondary)' }}>›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
