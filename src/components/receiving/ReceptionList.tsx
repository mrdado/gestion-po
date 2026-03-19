import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../layout/PageHeader';
import { supabase } from '../../lib/supabase';
import { Package, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export function ReceptionList() {
  const [pos, setPos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'pending' | 'completed' | 'all'>('pending');

  useEffect(() => {
    fetchPOs();
  }, []);

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          vendor:vendors(name),
          po_items(id, description, quantity_ordered, quantity_received)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPos(data || []);
    } catch (err) {
      console.error('Error fetching POs for reception:', err);
    } finally {
      setLoading(false);
    }
  };

  // Compute reception stats for each PO
  const posWithStats = pos.map(po => {
    const items = po.po_items || [];
    const totalOrdered = items.reduce((s: number, i: any) => s + Number(i.quantity_ordered), 0);
    const totalReceived = items.reduce((s: number, i: any) => s + Number(i.quantity_received || 0), 0);
    const pct = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;
    const isComplete = totalOrdered > 0 && totalReceived >= totalOrdered;
    const hasPartial = totalReceived > 0 && !isComplete;
    return { ...po, totalOrdered, totalReceived, pct, isComplete, hasPartial };
  });

  // Filter
  const filtered = posWithStats.filter(po => {
    // search
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      po.po_number?.toLowerCase().includes(q) ||
      po.vendor?.name?.toLowerCase().includes(q) ||
      po.project_number?.toLowerCase().includes(q);

    // status filter
    let matchesFilter = true;
    if (filter === 'pending') matchesFilter = !po.isComplete;
    if (filter === 'completed') matchesFilter = po.isComplete;

    return matchesSearch && matchesFilter;
  });

  const pendingCount = posWithStats.filter(p => !p.isComplete).length;
  const completedCount = posWithStats.filter(p => p.isComplete).length;

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        title="Réceptions"
        subtitle="Suivez et enregistrez les réceptions de marchandises"
        searchPlaceholder="Chercher N° BC, Fournisseur..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="px-8 flex flex-col gap-4">

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-5 flex items-center gap-4 border-l-4" style={{ borderColor: '#3B82F6' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-50">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Commandes</p>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{posWithStats.length}</p>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4 border-l-4" style={{ borderColor: '#F59E0B' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-50">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">En attente</p>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{pendingCount}</p>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4 border-l-4" style={{ borderColor: '#10B981' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-50">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Complètes</p>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{completedCount}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
            {[
              { key: 'pending' as const, label: 'En attente' },
              { key: 'completed' as const, label: 'Complètes' },
              { key: 'all' as const, label: 'Toutes' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filter === f.key
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Réceptions</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100" style={{ color: 'var(--text-secondary)' }}>
                {filtered.length} résultats
              </span>
            </div>
          </div>

          {/* Headers */}
          <div className="grid px-6 py-3 border-b border-gray-50" style={{
            gridTemplateColumns: '140px 1fr 120px 200px 120px',
            backgroundColor: 'var(--surface)',
          }}>
            {['N° BC', 'FOURNISSEUR', 'STATUT', 'PROGRESSION', 'ACTION'].map(h => (
              <span key={h} className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">Aucune commande trouvée.</div>
          ) : (
            filtered.map((po: any) => (
              <div
                key={po.id}
                className="grid items-center px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                style={{ gridTemplateColumns: '140px 1fr 120px 200px 120px' }}
              >
                <Link to={`/reception/${po.id}`} className="font-bold text-sm hover:underline" style={{ color: 'var(--text-primary)' }}>
                  {po.po_number}
                </Link>

                <div className="flex flex-col">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{po.vendor?.name || '-'}</span>
                  {po.project_number && (
                    <span className="text-xs text-gray-500">{po.project_number} {po.project_type ? `(${po.project_type})` : ''}</span>
                  )}
                </div>

                <div>
                  {po.status === 'Reçu' || po.isComplete ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" /> Complète
                    </span>
                  ) : po.status === 'Partiel' || po.hasPartial ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertCircle className="h-3 w-3" /> Partiel
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      <Clock className="h-3 w-3" /> En attente
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${po.pct}%`,
                        backgroundColor: po.isComplete ? '#10B981' : po.hasPartial ? '#F59E0B' : '#3B82F6'
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 min-w-[36px] text-right">{po.pct}%</span>
                </div>

                <div className="flex justify-end">
                  {!po.isComplete ? (
                    <Link
                      to={`/reception/${po.id}`}
                      className="px-3 py-1.5 text-xs font-medium bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Réceptionner
                    </Link>
                  ) : (
                    <Link
                      to={`/reception/${po.id}`}
                      className="px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Voir
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
