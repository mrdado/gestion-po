import { PageHeader } from '../layout/PageHeader';

export function POEntry() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        title="Créer un Bon de Commande"
        subtitle="Renseignez les informations du nouveau bon de commande"
        searchPlaceholder="Rechercher..."
      />

      <div className="px-8">
        <div className="card p-6 max-w-2xl">
          <h3 className="font-semibold text-base mb-5" style={{ color: 'var(--text-primary)' }}>Détails du BC</h3>
          <form className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--text-primary)' }}>Numéro de BC</label>
                <input className="w-full h-10 px-3 rounded-lg border text-sm outline-none"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--text-primary)' }}
                  placeholder="ex. PO-2026-001" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--text-primary)' }}>Fournisseur</label>
                <select className="w-full h-10 px-3 rounded-lg border text-sm outline-none bg-white"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--text-primary)' }}>
                  <option value="">Sélectionner un fournisseur</option>
                  <option>Fournisseur A</option>
                  <option>Fournisseur B</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--text-primary)' }}>Date de Livraison Prévue</label>
                <input type="date" className="w-full h-10 px-3 rounded-lg border text-sm outline-none"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--text-primary)' }}>Montant Total (€)</label>
                <input type="number" step="0.01" placeholder="0,00" className="w-full h-10 px-3 rounded-lg border text-sm outline-none"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--text-primary)' }} />
              </div>
            </div>

            <hr className="border-gray-100" />

            <div>
              <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Articles</h4>
              <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 80px 120px 40px' }}>
                <input className="h-9 px-3 rounded-lg border text-sm outline-none" placeholder="Description de l'article"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--text-primary)' }} />
                <input type="number" className="h-9 px-3 rounded-lg border text-sm outline-none" placeholder="Qté"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--text-primary)' }} />
                <input type="number" className="h-9 px-3 rounded-lg border text-sm outline-none" placeholder="Prix unit."
                  style={{ borderColor: 'var(--color-border)', color: 'var(--text-primary)' }} />
                <button type="button" className="h-9 w-9 flex items-center justify-center rounded-lg text-white text-lg font-bold"
                  style={{ backgroundColor: '#DC2626' }}>−</button>
              </div>
              <button type="button" className="btn-outline mt-3 w-full justify-center text-sm">+ Ajouter un Article</button>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn-outline">Annuler</button>
              <button type="submit" className="btn-primary">Créer le BC</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
