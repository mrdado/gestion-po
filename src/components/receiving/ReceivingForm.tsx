import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../layout/PageHeader';
import { supabase } from '../../lib/supabase';
import { CheckCircle2 } from 'lucide-react';

type POItem = {
  id: string;
  description: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
};

export function ReceivingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [po, setPo] = useState<any>(null);
  const [items, setItems] = useState<POItem[]>([]);
  const [receiveQty, setReceiveQty] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugError, setDebugError] = useState<any>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchPO();
  }, [id]);

  const fetchPO = async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          vendor:vendors(name),
          po_items(id, description, quantity_ordered, quantity_received, unit_price)
        `)
        .eq('id', id)
        .single();

      if (err) throw err;
      setPo(data);
      setItems(data.po_items || []);
      // Initialize receive quantities to 0
      const initQty: Record<string, number> = {};
      (data.po_items || []).forEach((item: POItem) => {
        initQty[item.id] = 0;
      });
      setReceiveQty(initQty);
    } catch (err: any) {
      console.error('Error fetching PO:', err);
      setError("Erreur lors du chargement du bon de commande.");
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveItem = async (item: POItem) => {
    const qty = receiveQty[item.id] || 0;
    if (qty <= 0) return;

    const remaining = item.quantity_ordered - (item.quantity_received || 0);
    const toReceive = Math.min(qty, remaining);
    const newReceived = (item.quantity_received || 0) + toReceive;

    setSubmitting(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('po_items')
        .update({ quantity_received: newReceived })
        .eq('id', item.id);

      if (err) throw err;

      // Update local state
      setItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, quantity_received: newReceived } : i
      ));
      setReceiveQty(prev => ({ ...prev, [item.id]: 0 }));
      setSuccess(`${toReceive} unité(s) de "${item.description}" réceptionnée(s) avec succès.`);
      setTimeout(() => setSuccess(null), 3000);

      // Check if all items are fully received → update PO status
      await checkAndUpdatePOStatus();
    } catch (err: any) {
      console.error('Error receiving item:', err);
      setDebugError(err);
      setError(`Erreur lors de la mise à jour de la réception: ${err.message || 'Inconnue'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiveAll = async (item: POItem) => {
    const remaining = item.quantity_ordered - (item.quantity_received || 0);
    if (remaining <= 0) return;

    setSubmitting(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('po_items')
        .update({ quantity_received: item.quantity_ordered })
        .eq('id', item.id);

      if (err) throw err;

      setItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, quantity_received: i.quantity_ordered } : i
      ));
      setSuccess(`"${item.description}" entièrement réceptionné.`);
      setTimeout(() => setSuccess(null), 3000);

      await checkAndUpdatePOStatus();
    } catch (err: any) {
      console.error('Error receiving all:', err);
      setError(`Erreur lors de la mise à jour: ${err.message || 'Inconnue'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const checkAndUpdatePOStatus = async () => {
    // Re-fetch fresh data to ensure we have the absolute latest DB state
    const { data: currentPO } = await supabase
      .from('purchase_orders')
      .select('status')
      .eq('id', id)
      .single();

    const { data: freshItems } = await supabase
      .from('po_items')
      .select('quantity_ordered, quantity_received')
      .eq('po_id', id);

    if (currentPO && freshItems) {
      const totalOrdered = freshItems.reduce((s, i) => s + Number(i.quantity_ordered), 0);
      const totalReceived = freshItems.reduce((s, i) => s + Number(i.quantity_received || 0), 0);
      
      let nextStatus = currentPO.status;
      
      if (totalOrdered > 0 && totalReceived >= totalOrdered) {
        nextStatus = 'Reçu';
      } else if (totalReceived > 0) {
        nextStatus = 'Partiel';
      } else {
        nextStatus = 'Commandé';
      }

      // Progress order: Commandé (0) < Partiel (1) < Reçu (2) < Facturé (3) < Payé (4)
      const statusOrder = ['Commandé', 'Partiel', 'Reçu', 'Facturé', 'Payé'];
      const currentIdx = statusOrder.indexOf(currentPO.status);
      const nextIdx = statusOrder.indexOf(nextStatus);

      if (nextIdx > currentIdx) {
        try {
          const { error: updateError } = await supabase
            .from('purchase_orders')
            .update({ status: nextStatus, updated_at: new Date().toISOString() })
            .eq('id', id);

          if (updateError) throw updateError;

          // Add audit log - don't fail the whole process if this small part fails
          try {
            await supabase.from('audit_logs').insert([{
              po_id: id,
              action: 'Changement de statut automatique (Réception)',
              status_from: currentPO.status,
              status_to: nextStatus,
              user_email: 'Système'
            }]);
          } catch (auditErr) {
            console.warn("Could not create audit log:", auditErr);
          }

          setPo((prev: any) => prev ? { ...prev, status: nextStatus } : prev);
        } catch (updateErr: any) {
          console.error("Failed to update PO status:", updateErr);
          setDebugError(updateErr);
          throw new Error(`Erreur lors de la mise à jour du statut: ${updateErr.message || 'Inconnue'}`);
        }
      }
    }
  };

  const handleFinishReception = async () => {
    if (!window.confirm("Marquer cette commande comme entièrement reçue ?")) return;

    setSubmitting(true);
    try {
      // Set all items to fully received
      for (const item of items) {
        if ((item.quantity_received || 0) < item.quantity_ordered) {
          await supabase
            .from('po_items')
            .update({ quantity_received: item.quantity_ordered })
            .eq('id', item.id);
        }
      }

      // Update PO status
      await supabase
        .from('purchase_orders')
        .update({ status: 'Reçu', updated_at: new Date().toISOString() })
        .eq('id', id);

      navigate('/receptions');
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la finalisation.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 pb-8">
        <PageHeader title="Réception" subtitle="Chargement..." searchPlaceholder="" />
        <div className="px-8"><div className="card p-8 text-center text-gray-500">Chargement...</div></div>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="flex flex-col gap-6 pb-8">
        <PageHeader title="Réception" subtitle="Commande introuvable" searchPlaceholder="" />
        <div className="px-8"><div className="card p-8 text-center text-gray-500">Bon de commande introuvable.</div></div>
      </div>
    );
  }

  const totalOrdered = items.reduce((s, i) => s + Number(i.quantity_ordered), 0);
  const totalReceived = items.reduce((s, i) => s + Number(i.quantity_received || 0), 0);
  const overallPct = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;
  const allComplete = totalOrdered > 0 && totalReceived >= totalOrdered;

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        title={`Réception – ${po.po_number}`}
        subtitle={`Fournisseur: ${po.vendor?.name || 'Inconnu'}${po.project_number ? ` • Affaire: ${po.project_number}` : ''}`}
        searchPlaceholder=""
        backLink={{ label: 'Retour aux Réceptions', to: '/receptions' }}
      />

      <div className="px-8 flex flex-col gap-4">

        {/* Overall progress banner */}
        <div className="card p-5 flex items-center gap-6 border-l-4" style={{ borderColor: allComplete ? '#10B981' : '#3B82F6' }}>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Progression globale</span>
              <span className="text-sm font-bold" style={{ color: allComplete ? '#10B981' : 'var(--text-primary)' }}>
                {totalReceived} / {totalOrdered} articles ({overallPct}%)
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${overallPct}%`, backgroundColor: allComplete ? '#10B981' : '#3B82F6' }}
              />
            </div>
          </div>
          {allComplete && (
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
              <CheckCircle2 className="h-5 w-5" />
              Réception complète
            </div>
          )}
        </div>

        {/* Success / Error messages */}
        {success && (
          <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-200">
            {success}
          </div>
        )}
        {error && (
          <div className="flex flex-col gap-2">
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 font-medium">
              {error}
            </div>
            {debugError && (
              <div className="p-4 bg-gray-900 text-gray-300 text-[10px] font-mono rounded-lg overflow-auto max-h-40">
                <p className="text-pink-400 mb-1 font-bold">DEBUG INFO (For Support):</p>
                <pre>{JSON.stringify({ 
                  message: debugError.message, 
                  code: debugError.code, 
                  hint: debugError.hint, 
                  details: debugError.details 
                }, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {/* Items list */}
        <div className="card p-6">
          <h3 className="font-semibold text-base mb-5" style={{ color: 'var(--text-primary)' }}>Articles à Réceptionner</h3>
          <div className="flex flex-col gap-6">
            {items.map(item => {
              const received = item.quantity_received || 0;
              const ordered = item.quantity_ordered;
              const pct = ordered > 0 ? Math.round((received / ordered) * 100) : 0;
              const full = received >= ordered;
              const remaining = ordered - received;

              return (
                <div key={item.id} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{item.description}</span>
                      <span className="text-xs text-gray-400">
                        Prix unitaire: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.unit_price)}
                      </span>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      {received} / {ordered} Reçus
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: full ? '#10B981' : '#3B82F6' }}
                    />
                  </div>
                  {!full && (
                    <div className="flex items-end gap-3 mt-3">
                      <div className="flex-1">
                        <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nouvelle quantité reçue</label>
                        <input
                          type="number"
                          min="0"
                          max={remaining}
                          placeholder={`max ${remaining}`}
                          value={receiveQty[item.id] || ''}
                          onChange={e => setReceiveQty(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                          className="w-full h-9 px-3 rounded-lg border text-sm outline-none"
                          style={{ borderColor: 'var(--color-border)', color: 'var(--text-primary)' }}
                        />
                      </div>
                      <button
                        disabled={submitting || !receiveQty[item.id]}
                        onClick={() => handleReceiveItem(item)}
                        className="btn-outline h-9 disabled:opacity-50"
                      >
                        Confirmer
                      </button>
                      <button
                        disabled={submitting}
                        onClick={() => handleReceiveAll(item)}
                        className="btn-primary h-9"
                      >
                        Tout Réceptionner ({remaining})
                      </button>
                    </div>
                  )}
                  {full && (
                    <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: '#16A34A' }}>
                      <CheckCircle2 className="h-4 w-4" />
                      Réception complète
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        {!allComplete && (
          <div className="flex justify-end">
            <button
              onClick={handleFinishReception}
              disabled={submitting}
              className="btn-primary px-6 py-2.5 disabled:opacity-50"
            >
              Terminer la Réception (tout marquer comme reçu)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
