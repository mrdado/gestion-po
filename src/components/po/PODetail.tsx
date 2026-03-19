import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, Trash2, Edit, Save, Loader2, FileText } from 'lucide-react';
import { PageHeader } from '../layout/PageHeader';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export function PODetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [po, setPo] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Note state
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPODetails();

      // Set up realtime subscription for this specific PO and its items
      const poChannel = supabase
        .channel(`po-detail-${id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'purchase_orders', 
          filter: `id=eq.${id}` 
        }, () => fetchPODetails())
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'po_items', 
          filter: `po_id=eq.${id}` 
        }, () => fetchPODetails())
        .subscribe();

      return () => {
        supabase.removeChannel(poChannel);
      };
    }
  }, [id]);

  const fetchPODetails = async () => {
    setLoading(true);
    try {
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          vendors (
            name, contact_email
          )
        `)
        .eq('id', id)
        .single();
      
      if (poError) throw poError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('po_items')
        .select('*')
        .eq('po_id', id)
        .order('created_at', { ascending: true });
        
      if (itemsError) throw itemsError;

      const { data: logsData, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('po_id', id)
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;

      setPo(poData);
      setNote(poData.internal_notes || '');
      setItems(itemsData || []);
      setLogs(logsData || []);
    } catch (err) {
      console.error("Error fetching PO details:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!po || !profile) return;
    setUpdating(true);

    try {
      const oldStatus = po.status;
      const { error: updateError } = await supabase
        .from('purchase_orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', po.id);
      
      if (updateError) throw updateError;

      await supabase.from('audit_logs').insert([{
        po_id: po.id,
        action: 'Changement de statut',
        status_from: oldStatus,
        status_to: newStatus,
        user_email: profile.email
      }]);

      // If transition to 'Reçu', mark all items as received
      if (newStatus === 'Reçu') {
        const { error: rpcError } = await supabase.rpc('mark_all_items_received', { p_po_id: po.id });
        
        if (rpcError) {
          console.warn("RPC mark_all_items_received failed, falling back to manual loop:", rpcError);
          for (const item of items) {
             await supabase.from('po_items').update({ quantity_received: item.quantity_ordered }).eq('id', item.id);
          }
        }
      }

      await fetchPODetails();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Erreur lors de la mise à jour.");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNote = async () => {
    if (!po) return;
    setSavingNote(true);
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update({ internal_notes: note })
        .eq('id', po.id);
      
      if (error) throw error;
      
      // Update local state to sync with DB
      setPo({ ...po, internal_notes: note });
    } catch (err: any) {
      console.error("Error saving note:", err);
      alert(`Impossible de sauvegarder la note: ${err.message || 'Erreur inconnue'}`);
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeletePO = async () => {
    if (!po) return;
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce bon de commande ? Cette action est irréversible.")) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', po.id);
      
      if (error) throw error;
      navigate('/bons-de-commande');
    } catch (err) {
      console.error("Error deleting PO:", err);
      alert("Erreur lors de la suppression.");
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!po) {
    return (
      <div className="p-8 text-center text-gray-500">Bon de commande introuvable.</div>
    );
  }

  const createdDate = new Date(po.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const subtotal = po.total_amount;
  const statusColors: any = {
    'Commandé': { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
    'Partiel': { bg: '#FFF7ED', text: '#D97706', border: '#FED7AA' },
    'Partielle': { bg: '#FFF7ED', text: '#D97706', border: '#FED7AA' },
    'Reçu': { bg: '#E8F0EC', text: '#16A34A', border: '#B5D5C5' },
    'Facturé': { bg: '#FEF3E2', text: '#D97706', border: '#FDE68A' },
    'Payé': { bg: '#F3E8FF', text: '#9333EA', border: '#E9D5FF' }
  };
  const st = statusColors[po.status] || { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB' };

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        title={`Détails du BC: ${po.po_number}`}
        subtitle=""
        searchPlaceholder="Rechercher..."
        backLink={{ label: 'Retour aux Bons de Commande', to: '/bons-de-commande' }}
      />

      <div className="px-8 flex flex-col gap-5">
        
        {/* ACTION BAR */}
        <div className="card p-5 border-l-4 flex items-center justify-between" style={{ borderColor: st.text }}>
           <div className="flex items-center gap-4">
             <div className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide" style={{ backgroundColor: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
               Statut: {po.status}
             </div>
           </div>
           
           <div className="flex items-center gap-3">
             {/* Transition Actions */}
             {(po.status === 'Commandé' || po.status === 'Partiel') && (
                <button onClick={() => updateStatus('Reçu')} disabled={updating} className="btn-primary text-sm px-4 bg-emerald-600 hover:bg-emerald-700">
                  Marquer comme Reçu
                </button>
             )}
             {po.status === 'Reçu' && (
                <button onClick={() => updateStatus('Facturé')} disabled={updating} className="btn-primary text-sm px-4 bg-yellow-600 hover:bg-yellow-700">
                  Marquer comme Facturé
                </button>
             )}
             {po.status === 'Facturé' && (
                <button onClick={() => updateStatus('Payé')} disabled={updating} className="btn-primary text-sm px-4 bg-indigo-600 hover:bg-indigo-700">
                  Marquer comme Payé
                </button>
             )}
             
             <div className="h-8 w-px bg-gray-200 mx-2"></div>

             {/* Management Actions */}
             <Link to={`/po/modifier/${po.id}`} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">
               <Edit className="h-4 w-4" />
               Modifier
             </Link>
             <button onClick={handleDeletePO} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition">
               <Trash2 className="h-4 w-4" />
               Supprimer
             </button>
           </div>
        </div>

        {/* PO Basic Info Banner */}
        <div className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50 border border-gray-100">
              <FileText className="h-7 w-7 text-gray-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{po.po_number}</h2>
              <p className="text-sm text-gray-500 mt-0.5">Fournisseur: <span className="font-semibold text-gray-900">{po.vendors?.name}</span></p>
            </div>
          </div>
          
          <div className="flex gap-10">
             <div>
               <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Date de création</p>
               <p className="text-sm font-medium mt-1">{createdDate}</p>
             </div>
             <div>
               <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">N° d'Affaire</p>
               <p className="text-sm font-medium mt-1">{po.project_number || '-'}</p>
             </div>
             <div>
               <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</p>
               <p className="text-sm font-medium mt-1">{po.project_type || '-'}</p>
             </div>
             <div>
               <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Montant Total</p>
               <p className="text-lg font-bold text-black mt-0.5">
                 {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(po.total_amount)}
               </p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main content col */}
          <div className="col-span-2 flex flex-col gap-6">
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Articles de la commande</h3>
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-500 font-medium">{items.length} lignes</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Qté Commandée</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Qté Reçue</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Prix Unit.</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-medium">{item.description}</td>
                      <td className="px-5 py-4 text-right text-gray-500">{item.quantity_ordered}</td>
                      <td className="px-5 py-4 text-right font-medium">
                        <span className={item.quantity_received >= item.quantity_ordered ? "text-emerald-600" : item.quantity_received > 0 ? "text-amber-600" : "text-gray-400"}>
                          {item.quantity_received || 0}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-gray-500">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.unit_price)}
                      </td>
                      <td className="px-5 py-4 text-right font-bold">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.quantity_ordered * item.unit_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-5 bg-gray-50 flex flex-col items-end gap-2 text-sm border-t border-gray-100">
                <div className="flex gap-8"><span className="text-gray-500">Sous-total :</span><span className="font-medium text-gray-900">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(subtotal)}</span></div>
                <div className="flex gap-8"><span className="text-gray-500">Total :</span><span className="text-xl font-bold text-indigo-600">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(subtotal)}</span></div>
              </div>
            </div>

            {/* Status History */}
            <div className="card p-5">
              <h3 className="font-semibold text-base mb-6" style={{ color: 'var(--text-primary)' }}>Historique du Statut</h3>
              <div className="flex flex-col">
                {logs.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Aucun historique disponible.</p>
                ) : (
                  logs.map((log: any, i: number) => (
                    <div key={log.id} className="flex gap-4 relative pb-6 last:pb-0">
                      {i < logs.length - 1 && <div className="absolute left-3.5 top-8 bottom-0 w-px bg-gray-100" />}
                      <div className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 z-10">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-semibold">{log.action}</p>
                          <span className="text-[10px] text-gray-400 font-medium">{new Date(log.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {log.status_from && (
                          <p className="text-[11px] text-gray-500 mt-1">
                            <span className="px-1.5 py-0.5 rounded bg-gray-100">{log.status_from}</span>
                            <span className="mx-2">→</span>
                            <span className="px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: statusColors[log.status_to]?.bg, color: statusColors[log.status_to]?.text }}>{log.status_to}</span>
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1 italic">{log.user_email || 'Système'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Side col */}
          <div className="flex flex-col gap-6">
            {/* Internal Notes */}
            <div className="card p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400">Notes Internes</h3>
                {savingNote && <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />}
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ajouter des notes sur cette commande..."
                className="w-full text-sm px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all min-h-[160px] resize-none"
              />
              <button
                onClick={handleSaveNote}
                disabled={savingNote || note === (po.internal_notes || '')}
                className="w-full h-11 flex items-center justify-center gap-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <Save className="h-4 w-4" />
                Sauvegarder la Note
              </button>
            </div>

            {/* Vendor card mini */}
            <div className="card p-5">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Support Fournisseur</h3>
              <p className="text-sm font-bold">{po.vendors?.name}</p>
              {po.vendors?.contact_email ? (
                <a href={`mailto:${po.vendors.contact_email}`} className="text-xs text-indigo-600 hover:underline mt-2 block">
                  {po.vendors.contact_email}
                </a>
              ) : (
                <p className="text-xs text-gray-400 mt-1">Pas d'email de contact</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

