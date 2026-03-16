import { PageHeader } from '../layout/PageHeader';

const items = [
  { id: 1, desc: 'Laptops Dell XPS 15', ordered: 10, received: 4 },
  { id: 2, desc: "Moniteurs LG 27''",   ordered: 20, received: 20 },
];

export function ReceivingForm() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        title="Réception – PO-2026-001"
        subtitle="Enregistrez les articles entrants et suivez les réceptions partielles"
        searchPlaceholder="Rechercher..."
        backLink={{ label: 'Retour aux Bons de Commande', to: '/bons-de-commande' }}
      />

      <div className="px-8 flex flex-col gap-4">
        <div className="card p-6">
          <h3 className="font-semibold text-base mb-5" style={{ color: 'var(--text-primary)' }}>Articles à Réceptionner</h3>
          <div className="flex flex-col gap-6">
            {items.map(item => {
              const pct = Math.round((item.received / item.ordered) * 100);
              const full = item.received >= item.ordered;
              return (
                <div key={item.id} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{item.desc}</span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{item.received} / {item.ordered} Reçus</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden mb-3">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: full ? '#5BA07A' : 'var(--accent)' }} />
                  </div>
                  {!full && (
                    <div className="flex items-end gap-3 mt-3">
                      <div className="flex-1">
                        <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nouvelle quantité reçue</label>
                        <input type="number" min="0" max={item.ordered - item.received} placeholder="ex. 2"
                          className="w-full h-9 px-3 rounded-lg border text-sm outline-none"
                          style={{ borderColor: 'var(--color-border)', color: 'var(--text-primary)' }} />
                      </div>
                      <button className="btn-outline h-9">Confirmer</button>
                      <button className="btn-primary h-9">Tout Réceptionner ({item.ordered - item.received})</button>
                    </div>
                  )}
                  {full && (
                    <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: '#16A34A' }}>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Réception complète
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button className="btn-primary px-6 py-2.5">Terminer la Réception</button>
        </div>
      </div>
    </div>
  );
}
