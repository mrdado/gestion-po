import { useState, useEffect } from 'react';
import { MoreHorizontal, Plus, Trash2, Edit } from 'lucide-react';
import { PageHeader } from '../layout/PageHeader';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Badge } from '../ui/Badge';

const statusMap: Record<string, { label: string; variant: 'commandé' | 'partiel' | 'reçu' | 'facturé' | 'payé' }> = {
  'Commandé':        { label: 'COMMANDÉ',       variant: 'commandé' },
  'Partiel':         { label: 'PARTIEL',        variant: 'partiel' },
  'Partielle':       { label: 'PARTIEL',        variant: 'partiel' },
  'Reçu':            { label: 'REÇU',           variant: 'reçu' },
  'Facturé':         { label: 'FACTURÉ',        variant: 'facturé' },
  'Payé':            { label: 'PAYÉ',           variant: 'payé' },
};

export function POList() {
  const navigate = useNavigate();
  const [pos, setPos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetchPOs();

    // Set up realtime subscription
    const channel = supabase
      .channel('public:purchase_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_orders' }, () => {
        fetchPOs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPOs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, vendor:vendors(name, contact_email)')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching POs:', error);
    } else {
      setPos(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Voulez-vous vraiment supprimer ce bon de commande ?")) return;

    try {
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setPos(pos.filter(p => p.id !== id));
      setMenuOpenId(null);
    } catch (err) {
      console.error("Error deleting PO:", err);
      alert("Erreur lors de la suppression.");
    }
  };

  // Helper to format currency
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
  };

  // Helper to safely map old mock statuses or db statuses
  const getStatusDisplay = (status: string) => {
    return statusMap[status] || { label: status.toUpperCase(), variant: 'secondary' as const };
  };

  // Filter Logic
  const filteredPOs = pos.filter((po) => {
    const matchesSearch = 
      po.po_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.vendor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.project_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Exact match for status filter if defined, or true if 'ALL' or empty
    const matchesStatus = statusFilter === '' || statusFilter === 'ALL' ? true : po.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        title="Bons de Commande"
        subtitle="Gérez et suivez vos achats"
        searchPlaceholder="Rechercher BC, fournisseurs..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="px-8 flex flex-col gap-4">
        
        {/* Filters & Actions Bar */}
        <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-1 items-center gap-3">

            <div className="h-6 w-px bg-gray-200 mx-1"></div>

            <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
              {['ALL', 'Commandé', 'Partiel', 'Reçu', 'Facturé', 'Payé'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status === 'ALL' ? '' : status)}
                  aria-label={`Filtrer par statut ${status}`}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    (statusFilter === status || (statusFilter === '' && status === 'ALL'))
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                  style={{
                    outlineColor: 'var(--accent)'
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/bons-de-commande/nouveau')}
              className="btn-primary-token"
              aria-label="Créer un nouveau bon de commande"
            >
              <Plus className="h-4 w-4" />
              Nouveau BC
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Toutes les Commandes</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100" style={{ color: 'var(--text-secondary)' }}>
                {filteredPOs.length} Total
              </span>
            </div>
          </div>

          {/* Column headers */}
          <div className="grid px-6 py-3 border-b border-gray-50" style={{
            gridTemplateColumns: '140px 1fr 140px 120px 140px 140px 48px',
            backgroundColor: 'var(--surface)',
          }}>
            {['N° BC', 'FOURNISSEUR', 'AFFAIRE', 'DATE PRÉVUE', 'MONTANT', 'STATUT', ''].map(h => (
              <span key={h} className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            <div className="p-8 text-center loading-message">Chargement des bons de commande...</div>
          ) : filteredPOs.length === 0 ? (
            <div className="p-8 text-center empty-state">Aucun bon de commande trouvé.</div>
          ) : (
            filteredPOs.map((po: any) => {
              const st = getStatusDisplay(po.status);
              
              const dateStr = po.expected_delivery_date 
                ? new Date(po.expected_delivery_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'Non définie';

              return (
                <div
                  key={po.id}
                  className="grid items-center px-6 py-4 border-b border-gray-50 last:border-0 hover-surface relative"
                  style={{ gridTemplateColumns: '140px 1fr 140px 120px 140px 140px 48px' }}
                >
                  <Link to={`/po/${po.id}`} className="font-bold text-sm hover:underline" style={{ color: 'var(--text-primary)' }}>
                    {po.po_number}
                  </Link>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <Link 
                        to={`/fournisseur/${po.vendor_id}`} 
                        className="text-sm font-medium hover:text-emerald-600 transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {po.vendor?.name || 'Fournisseur Inconnu'}
                      </Link>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{po.project_number || '-'}</span>
                    <span className="text-xs text-gray-500">{po.project_type || ''}</span>
                  </div>

                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{dateStr}</span>

                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(po.total_amount, po.currency)}
                  </span>

                   <div>
                    <Badge variant={st.variant}>
                      {st.label}
                    </Badge>
                   </div>

                  <div className="relative flex justify-end">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === po.id ? null : po.id);
                      }}
                      className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-200 transition-colors text-gray-400"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {menuOpenId === po.id && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-[100] py-2">
                        <button 
                          onClick={() => navigate(`/po/modifier/${po.id}`)}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Edit className="h-4 w-4 text-gray-400" />
                          Modifier
                        </button>
                        <button 
                          onClick={(e) => handleDelete(po.id, e)}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
