import { Download, MapPin, CheckCircle, Eye, Clock } from 'lucide-react';
import { PageHeader } from '../layout/PageHeader';

const lineItems = [
  { desc: 'Filtres HVAC Commerciaux',        sub: 'Réf. #HV-0029-X',     qty: 12, price: 45.00,  total: 540.00 },
  { desc: 'Ampoules LED Industrielles',       sub: '10 unités, Blanc Chaud', qty: 5, price: 120.00, total: 600.00 },
  { desc: 'Sections de Tuyaux en Cuivre (1/2")', sub: 'Longueur : 10ft',   qty: 20, price: 85.00,  total: 1700.00 },
  { desc: 'Capteur de Sécurité Extérieur',   sub: 'Modèle : SN-500 Pro',  qty: 3,  price: 636.67, total: 1910.01 },
];

const activity = [
  { icon: CheckCircle, label: 'BC Créé',                    sub: 'Par John Doe',              date: '12 Sep, 09h29', filled: true },
  { icon: Eye,          label: 'Fournisseur Confirmé',       sub: 'Stock Disponible',          date: '12 Sep, 10h15', filled: false },
  { icon: Clock,        label: 'Envoyé pour Approbation',   sub: 'En Attente de la Direction', date: '12 Sep, 11h30', filled: false },
];

export function PODetail() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        title="Détails du Bon de Commande"
        subtitle=""
        searchPlaceholder="Rechercher BC, Fournisseur..."
        backLink={{ label: 'Retour aux Bons de Commande', to: '/bons-de-commande' }}
      />

      <div className="px-8 flex flex-col gap-5">
        {/* PO Banner */}
        <div className="card p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8F2EC' }}>
              <svg className="h-6 w-6" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>PO-94204922</span>
                <span className="badge badge-pending">EN ATTENTE D'APPROBATION</span>
              </div>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Créé le 12 Sep 2024 par <strong>John Doe</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-outline">
              <Download className="h-4 w-4" />
              Télécharger PDF
            </button>
            <button className="btn-primary px-5 py-2.5 rounded-lg text-sm font-medium">
              Approuver
            </button>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-3 gap-5 items-start">
          {/* Left col: vendor + shipping + line items */}
          <div className="col-span-2 flex flex-col gap-5">
            {/* Vendor + Shipping side by side */}
            <div className="grid grid-cols-2 gap-5">
              {/* Vendor */}
              <div className="card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Détails Fournisseur</p>
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
                  <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>ABC</span>
                </div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>ABC Maintenance Supplies</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>789 Industrial Pkwy, Springfield</p>
                <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>Contact : Mark Stevenson</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--accent)' }}>mark.s@abcsupplies.com</p>
              </div>

              {/* Shipping */}
              <div className="card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Adresse de Livraison</p>
                <div className="flex gap-2">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>721 Meadowview Office</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Suite 400, North Springfield</p>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>Att. : Département Réception</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>+1 (555) 123-4567</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Articles</h3>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>4 Articles au Total</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50" style={{ backgroundColor: 'var(--surface-alt)' }}>
                    {['DESCRIPTION', 'QUANTITÉ', 'PRIX UNITAIRE', 'TOTAL'].map(h => (
                      <th key={h} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider ${h === 'DESCRIPTION' ? 'text-left' : 'text-right'}`} style={{ color: 'var(--text-tertiary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{item.desc}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{item.sub}</p>
                      </td>
                      <td className="px-5 py-4 text-right text-sm" style={{ color: 'var(--text-secondary)' }}>{item.qty}</td>
                      <td className="px-5 py-4 text-right text-sm" style={{ color: 'var(--text-secondary)' }}>{item.price.toFixed(2)} €</td>
                      <td className="px-5 py-4 text-right text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.total.toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-4 flex flex-col items-end gap-1 border-t border-gray-100">
                <div className="flex gap-8 text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Sous-total :</span>
                  <span style={{ color: 'var(--text-primary)' }}>4 750,01 €</span>
                </div>
                <div className="flex gap-8 text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Taxe (0%) :</span>
                  <span style={{ color: 'var(--text-primary)' }}>0,00 €</span>
                </div>
                <div className="flex gap-8 font-bold mt-1 pt-2 border-t border-gray-100">
                  <span style={{ color: 'var(--text-primary)' }}>Total :</span>
                  <span style={{ color: 'var(--accent)' }}>4 750,01 €</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right col: activity + notes */}
          <div className="flex flex-col gap-5">
            {/* Order Activity */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Activité de la Commande</h3>
                <button className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Voir Détails</button>
              </div>
              <div className="relative flex flex-col gap-0">
                {activity.map((a, i) => (
                  <div key={i} className="flex gap-3 pb-5 last:pb-0 relative">
                    {/* Connector line */}
                    {i < activity.length - 1 && (
                      <div className="absolute left-4 top-8 bottom-0 w-px" style={{ backgroundColor: '#E5E7EB' }} />
                    )}
                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center z-10 ${a.filled ? 'text-white' : 'bg-white border-2 border-gray-200'}`}
                      style={a.filled ? { backgroundColor: 'var(--btn-primary)' } : {}}>
                      <a.icon className="h-4 w-4" style={{ color: a.filled ? '#fff' : 'var(--text-tertiary)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{a.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{a.sub}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{a.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Internal Notes */}
            <div className="card p-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Notes Internes</p>
              <p className="text-sm italic mb-4 p-3 rounded-lg" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--surface-alt)' }}>
                "Nécessaire d'urgence pour la révision HVAC de Meadowview prévue la semaine prochaine."
              </p>
              <textarea
                placeholder="Ajouter une note..."
                className="w-full text-sm px-3 py-2 rounded-lg border outline-none resize-none h-20"
                style={{ borderColor: 'var(--color-border)', color: 'var(--text-primary)' }}
              />
              <button className="btn-outline mt-3 w-full justify-center">Publier la Note</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
