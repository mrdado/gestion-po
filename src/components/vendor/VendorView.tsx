import { MoreHorizontal, TrendingUp } from 'lucide-react';
import { PageHeader } from '../layout/PageHeader';

const kpis = [
  { icon: '🏢', iconBg: '#E8F2EC', title: 'Total Fournisseurs', value: '128', trend: '+12%', trendUp: true, sub: 'Actif depuis le dernier trimestre' },
  { icon: '📋', iconBg: '#EDE8F5', title: 'BC en Attente',      value: '45',  trend: '+5%',  trendUp: false, sub: 'Nécessite une attention immédiate' },
  { icon: '🛡️', iconBg: '#FEF3E2', title: 'Taux de Conformité', value: '98,2%', trend: '+2,4%', trendUp: true, sub: 'Documents à jour' },
];

const vendors = [
  { initials: 'SJ', cls: 'initials-sj', name: 'Swift Janitorial Inc.',   joined: 'Rejoint Sep 2023', contact: 'Jacob Jones',   avatar: '#D1D5DB', category: 'Nettoyage & Hygiène',    pos: 12, status: 'actif' },
  { initials: 'BP', cls: 'initials-bp', name: 'Bright Phase Electrical', joined: 'Rejoint Jan 2024', contact: 'Albert Flores',  avatar: '#374151', category: 'Maintenance Électrique', pos: 4,  status: 'actif' },
  { initials: 'HV', cls: 'initials-hv', name: 'HVAC Pro Solutions',      joined: 'Rejoint Mar 2024', contact: 'Robert Fox',     avatar: '#9CA3AF', category: 'Contrôle Climatique',   pos: 8,  status: 'integration' },
  { initials: 'GP', cls: 'initials-gp', name: 'Green Peak Landscaping',  joined: 'Rejoint Jul 2024', contact: 'Kristin Watson', avatar: '#D1D5DB', category: 'Espaces Extérieurs',    pos: 2,  status: 'actif' },
];

const statusMap: Record<string, { label: string; cls: string }> = {
  actif:       { label: 'ACTIF',       cls: 'badge-actif' },
  integration: { label: 'INTÉGRATION', cls: 'badge-integration' },
};

export function VendorView() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        title="Répertoire Fournisseurs"
        subtitle="Gérez et surveillez vos prestataires externes"
        searchPlaceholder="Rechercher Fournisseurs..."
      />

      <div className="px-8 flex flex-col gap-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-5">
          {kpis.map((k, i) => (
            <div key={i} className="card p-5 relative">
              <button className="absolute top-4 right-4 text-gray-300 hover:text-gray-500">
                <MoreHorizontal className="h-4 w-4" />
              </button>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3" style={{ backgroundColor: k.iconBg }}>
                {k.icon}
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{k.title}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{k.value}</span>
                <span className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: k.trendUp ? '#16A34A' : '#DC2626' }}>
                  <TrendingUp className="h-3 w-3" />{k.trend}
                </span>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Partners table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Partenaires Actifs</h3>
            <button className="btn-primary">+ Ajouter un Fournisseur</button>
          </div>

          <div className="card overflow-hidden">
            {/* Column headers */}
            <div className="grid px-6 py-3 border-b border-gray-50" style={{
              gridTemplateColumns: '2fr 1.5fr 1.5fr 100px 120px 100px',
              backgroundColor: 'var(--surface)',
            }}>
              {['Nom Fournisseur', 'Contact Principal', 'Catégorie', 'BC Actifs', 'Statut', 'Actions'].map(h => (
                <span key={h} className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{h}</span>
              ))}
            </div>

            {vendors.map((v, i) => {
              const st = statusMap[v.status];
              return (
                <div
                  key={i}
                  className="grid items-center px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                  style={{ gridTemplateColumns: '2fr 1.5fr 1.5fr 100px 120px 100px' }}
                >
                  {/* Vendor name */}
                  <div className="flex items-center gap-3">
                    <span className={`w-9 h-9 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${v.cls}`}>
                      {v.initials}
                    </span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{v.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{v.joined}</p>
                    </div>
                  </div>
                  {/* Contact */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full shrink-0" style={{ backgroundColor: v.avatar }} />
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{v.contact}</span>
                  </div>
                  {/* Category */}
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{v.category}</span>
                  {/* Active POs */}
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{String(v.pos).padStart(2, '0')}</span>
                  {/* Status */}
                  <span className={`badge ${st.cls}`}>{st.label}</span>
                  {/* Actions */}
                  <button className="text-sm font-medium hover:underline text-left" style={{ color: 'var(--accent)' }}>Voir Profil</button>
                </div>
              );
            })}

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Affichage 1 à 4 sur 128 fournisseurs</span>
              <div className="flex items-center gap-2">
                <button className="btn-outline py-1.5 px-3 text-xs">Précédent</button>
                {[1, 2, 3].map(p => (
                  <button
                    key={p}
                    className="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
                    style={p === 1 ? { backgroundColor: 'var(--btn-primary)', color: '#fff' } : { color: 'var(--text-secondary)' }}
                  >{p}</button>
                ))}
                <button className="btn-outline py-1.5 px-3 text-xs">Suivant</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
