import { useState, useEffect } from 'react';
import { PageHeader } from '../layout/PageHeader';
import { supabase } from '../../lib/supabase';
import { useNavigate, useParams } from 'react-router-dom';

type POItemInput = {
  id: string; // internal id for React key mapping
  db_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
};

export function POEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<any[]>([]);
  const [poNumber, setPoNumber] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [items, setItems] = useState<POItemInput[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0 }
  ]);
  const [projectNumber, setProjectNumber] = useState('');
  const [projectType, setProjectType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(id);

  useEffect(() => {
    fetchVendors();
    if (isEdit) {
      fetchExistingPO();
    }
  }, [id]);

  const fetchVendors = async () => {
    const { data } = await supabase
      .from('vendors')
      .select('id, name')
      .order('name');
    if (data) {
      setVendors(data);
    }
  };

  const fetchExistingPO = async () => {
    setLoading(true);
    try {
      const { data: po, error: poErr } = await supabase
        .from('purchase_orders')
        .select(`*, po_items(*)`)
        .eq('id', id)
        .single();
      
      if (poErr) throw poErr;
      if (po) {
        setPoNumber(po.po_number);
        setVendorId(po.vendor_id);
        setDeliveryDate(po.expected_delivery_date ? po.expected_delivery_date.substring(0, 10) : '');
        setProjectNumber(po.project_number || '');
        setProjectType(po.project_type || '');
        
        if (po.po_items && po.po_items.length > 0) {
          setItems(po.po_items.map((item: any) => ({
            id: crypto.randomUUID(),
            db_id: item.id,
            description: item.description,
            quantity: item.quantity_ordered,
            unit_price: item.unit_price
          })));
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors du chargement du BC.");
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof POItemInput, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!poNumber || !vendorId || items.length === 0) {
        throw new Error('Veuillez remplir tous les champs obligatoires.');
      }

      const invalidItems = items.some(item => !item.description || item.quantity <= 0 || item.unit_price < 0);
      if (invalidItems) {
        throw new Error('Veuillez vérifier les articles.');
      }

      if (isEdit) {
        const { error: poError } = await supabase
          .from('purchase_orders')
          .update({
            po_number: poNumber,
            vendor_id: vendorId,
            total_amount: totalAmount,
            expected_delivery_date: deliveryDate || null,
            project_number: projectNumber || null,
            project_type: projectType || null
          })
          .eq('id', id);
        if (poError) throw poError;

        await supabase.from('po_items').delete().eq('po_id', id);
        
        const itemsToInsert = items.map(item => ({
          po_id: id,
          description: item.description,
          quantity_ordered: item.quantity,
          unit_price: item.unit_price
        }));

        const { error: itemsError } = await supabase.from('po_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;

      } else {
        const { data: poData, error: poError } = await supabase
          .from('purchase_orders')
          .insert([{
            po_number: poNumber,
            vendor_id: vendorId,
            status: 'Commandé',
            total_amount: totalAmount,
            currency: 'EUR',
            expected_delivery_date: deliveryDate || null,
            project_number: projectNumber || null,
            project_type: projectType || null
          }])
          .select()
          .single();
        if (poError) throw poError;

        const itemsToInsert = items.map(item => ({
          po_id: poData.id,
          description: item.description,
          quantity_ordered: item.quantity,
          unit_price: item.unit_price
        }));

        const { error: itemsError } = await supabase.from('po_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }

      navigate(isEdit ? `/po/${id}` : '/bons-de-commande');

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-sm text-gray-500">Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        title={isEdit ? "Modifier le Bon de Commande" : "Créer un Bon de Commande"}
        subtitle={isEdit ? `Modification du BC ${poNumber}` : "Renseignez les informations du nouveau bon de commande"}
        searchPlaceholder="Rechercher..."
        backLink={{ label: 'Retour aux Bons de Commande', to: '/bons-de-commande' }}
      />

      <div className="px-8">
        <div className="card p-6 max-w-3xl border-t-4" style={{ borderColor: 'var(--accent)' }}>
          <h3 className="font-semibold text-lg mb-6" style={{ color: 'var(--text-primary)' }}>
            {isEdit ? 'Modifier BC' : 'Nouveau BC'}
          </h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Numéro de BC *</label>
                <input 
                  required
                  value={poNumber}
                  onChange={e => setPoNumber(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border text-sm outline-none transition-colors focus:border-black"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--text-primary)', backgroundColor: 'var(--bg)' }}
                  placeholder="ex. PO-2026-001" 
                />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Fournisseur *</label>
                <select 
                  required
                  value={vendorId}
                  onChange={e => setVendorId(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border text-sm outline-none transition-colors focus:border-black"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--text-primary)', backgroundColor: 'var(--bg)' }}>
                  <option value="">Sélectionner un fournisseur</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>N° d'affaire</label>
                <input 
                  value={projectNumber}
                  onChange={e => setProjectNumber(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border text-sm outline-none transition-colors focus:border-black"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--text-primary)', backgroundColor: 'var(--bg)' }}
                  placeholder="ex. AFF-2026-X" 
                />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Type d'affaire</label>
                <select 
                  value={projectType}
                  onChange={e => setProjectType(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border text-sm outline-none transition-colors focus:border-black"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--text-primary)', backgroundColor: 'var(--bg)' }}>
                  <option value="">Sélectionner un type</option>
                  <option value="RDI">RDI</option>
                  <option value="FG">FG</option>
                  <option value="Comm">Comm</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Date de Livraison Prévue</label>
                <input 
                  type="date" 
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border text-sm outline-none transition-colors focus:border-black"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--text-primary)', backgroundColor: 'var(--bg)' }} 
                />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Montant Total Calculé</label>
                <div className="w-full h-11 px-3 rounded-lg border flex items-center font-bold text-lg"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--text-primary)', backgroundColor: 'var(--surface-alt)' }}>
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalAmount)}
                </div>
              </div>
            </div>

            <hr className="border-gray-100 my-2" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Articles de la Commande</h4>
              </div>
              
              <div className="grid gap-3 mb-2 px-2" style={{ gridTemplateColumns: '1fr 100px 140px 100px 40px' }}>
                <span className="text-xs font-semibold text-gray-500 uppercase">Description</span>
                <span className="text-xs font-semibold text-gray-500 uppercase text-right">Quantité</span>
                <span className="text-xs font-semibold text-gray-500 uppercase text-right">Prix Unit. (€)</span>
                <span className="text-xs font-semibold text-gray-500 uppercase text-right">Total</span>
                <span></span>
              </div>

              <div className="flex flex-col gap-3">
                {items.map((item, index) => (
                  <div key={item.id} className="grid items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-100" style={{ gridTemplateColumns: '1fr 100px 140px 100px 40px' }}>
                    <input 
                      required
                      value={item.description}
                      onChange={e => updateItem(item.id, 'description', e.target.value)}
                      className="h-10 px-3 flex-1 rounded-md border text-sm outline-none focus:border-black" 
                      placeholder="Description de l'article..."
                      style={{ borderColor: 'var(--color-border)' }} 
                    />
                    <input 
                      type="number" 
                      min="1"
                      required
                      value={item.quantity}
                      onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                      className="h-10 px-3 w-full rounded-md border text-sm outline-none text-right focus:border-black" 
                      placeholder="Qté"
                      style={{ borderColor: 'var(--color-border)' }} 
                    />
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      required
                      value={item.unit_price}
                      onChange={e => updateItem(item.id, 'unit_price', parseFloat(e.target.value))}
                      className="h-10 px-3 w-full rounded-md border text-sm outline-none text-right focus:border-black" 
                      placeholder="Prix"
                      style={{ borderColor: 'var(--color-border)' }} 
                    />
                    
                    <div className="text-right text-sm font-semibold pr-2">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.quantity * item.unit_price)}
                    </div>

                    <button 
                      type="button" 
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="h-10 w-full flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30"
                      title="Retirer la ligne"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                  </div>
                ))}
              </div>
              
              <button 
                type="button" 
                onClick={addItem}
                className="btn-outline mt-4 w-full justify-center text-sm py-2.5 border-dashed border-2 hover:bg-gray-50"
              >
                + Ajouter un Article
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-2">
              <button 
                type="button" 
                onClick={() => navigate('/bons-de-commande')}
                className="btn-outline px-6"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button 
                type="submit" 
                className="btn-primary px-8"
                style={isSubmitting ? { opacity: 0.7 } : {}}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enregistrement...' : (isEdit ? 'Enregistrer les modifications' : 'Créer le BC')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
