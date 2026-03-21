import { useState, useEffect, useMemo } from 'react';
import { MoreHorizontal, Plus, Trash2, Edit, Upload, ChevronUp, ChevronDown } from 'lucide-react';
import { PageHeader } from '../layout/PageHeader';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Badge } from '../ui/Badge';
import { DataImporter } from './DataImporter';

const statusMap: Record<string, { label: string; variant: 'commandé' | 'partiel' | 'reçu' | 'facturé' | 'payé' }> = {
  'Commandé':        { label: 'COMMANDÉ',       variant: 'commandé' },
  'Partiel':         { label: 'PARTIEL',        variant: 'partiel' },
  'Partielle':       { label: 'PARTIEL',        variant: 'partiel' },
  'Reçu':            { label: 'REÇU',           variant: 'reçu' },
  'Facturé':         { label: 'FACTURÉ',        variant: 'facturé' },
  'Payé':            { label: 'PAYÉ',           variant: 'payé' },
};

type SortField = 'po_number' | 'po_date' | 'vendor_name' | 'project_number' | 'expected_delivery_date' | 'invoice_number' | 'total_amount' | 'status';
type SortDirection = 'asc' | 'desc' | null;

export function POList() {
  const navigate = useNavigate();
  const [pos, setPos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [showImporter, setShowImporter] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

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
  const filteredPOs = useMemo(() => {
    return pos.filter((po) => {
      const matchesSearch = 
        po.po_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.vendor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.project_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Exact match for status filter if defined, or true if 'ALL' or empty
      const matchesStatus = statusFilter === '' || statusFilter === 'ALL' ? true : po.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [pos, searchQuery, statusFilter]);

  // Sorting Logic
  const sortedPOs = useMemo(() => {
    if (!sortField || !sortDirection) return filteredPOs;

    const sorted = [...filteredPOs].sort((a, b) => {
      // Special handling for date fields - nulls always go to end
      if (sortField === 'po_date') {
        const aDate = a.po_date ? new Date(a.po_date).getTime() : null;
        const bDate = b.po_date ? new Date(b.po_date).getTime() : null;
        
        if (aDate === null && bDate === null) return 0;
        if (aDate === null) return 1;  // a to end
        if (bDate === null) return -1; // b to end
        
        if (sortDirection === 'asc') {
          return aDate > bDate ? 1 : aDate < bDate ? -1 : 0;
        } else {
          return aDate < bDate ? 1 : aDate > bDate ? -1 : 0;
        }
      }

      if (sortField === 'expected_delivery_date') {
        const aDate = a.expected_delivery_date ? new Date(a.expected_delivery_date).getTime() : null;
        const bDate = b.expected_delivery_date ? new Date(b.expected_delivery_date).getTime() : null;
        
        if (aDate === null && bDate === null) return 0;
        if (aDate === null) return 1;  // a to end
        if (bDate === null) return -1; // b to end
        
        if (sortDirection === 'asc') {
          return aDate > bDate ? 1 : aDate < bDate ? -1 : 0;
        } else {
          return aDate < bDate ? 1 : aDate > bDate ? -1 : 0;
        }
      }

      // Regular fields
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case 'po_number':
          aVal = a.po_number || '';
          bVal = b.po_number || '';
          break;
        case 'vendor_name':
          aVal = a.vendor?.name?.toLowerCase() || '';
          bVal = b.vendor?.name?.toLowerCase() || '';
          break;
        case 'project_number':
          aVal = a.project_number || '';
          bVal = b.project_number || '';
          break;
        case 'invoice_number':
          aVal = a.invoice_number || '';
          bVal = b.invoice_number || '';
          break;
        case 'total_amount':
          aVal = Number(a.total_amount) || 0;
          bVal = Number(b.total_amount) || 0;
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    return sorted;
  }, [filteredPOs, sortField, sortDirection]);

  // Handle column header click to cycle through sort states
  const handleColumnSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      // New column: start with ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Helper to render sort indicator
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 inline ml-1" style={{ color: 'var(--accent)' }} />
      : <ChevronDown className="h-4 w-4 inline ml-1" style={{ color: 'var(--accent)' }} />;
  };

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
        {showImporter && (
          <DataImporter 
            onClose={() => setShowImporter(false)} 
            onSuccess={fetchPOs} 
          />
        )}
        
        {/* Filters & Actions Bar */}
        <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-xl shadow-sm border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex flex-1 items-center gap-3">

            <div className="h-6 w-px mx-1" style={{ backgroundColor: 'var(--color-border)' }}></div>

            <div className="flex p-1 rounded-lg border" style={{ backgroundColor: 'var(--surface-alt)', borderColor: 'var(--color-border)' }}>
              {['ALL', 'Commandé', 'Partiel', 'Reçu', 'Facturé', 'Payé'].map(status => (
                <button
                   key={status}
                   onClick={() => setStatusFilter(status === 'ALL' ? '' : status)}
                   aria-label={`Filtrer par statut ${status}`}
                   className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      (statusFilter === status || (statusFilter === '' && status === 'ALL'))
                        ? 'shadow-sm'
                        : ''
                    }`}
                   style={
                      (statusFilter === status || (statusFilter === '' && status === 'ALL'))
                        ? { backgroundColor: 'var(--surface)', color: 'var(--text-primary)', border: `0.8px solid var(--color-border)`, outlineColor: 'var(--accent)' }
                        : { color: 'var(--text-secondary)', outlineColor: 'var(--accent)' }
                    }
                 >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowImporter(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-black rounded-xl transition-all shadow-sm"
              style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-alt)'}
              aria-label="Importer des données depuis CSV"
            >
              <Upload className="h-4 w-4" />
              Importer CSV
            </button>

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
        <div className="card">
          <div className="flex items-center justify-between px-6 py-4 overflow-hidden" style={{ borderBottom: `0.8px solid var(--color-border)` }}>
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Toutes les Commandes</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100" style={{ color: 'var(--text-secondary)' }}>
                {sortedPOs.length} Total
              </span>
            </div>
          </div>

          {/* Column headers */}
          <div className="grid px-6 py-3 overflow-hidden" style={{
            gridTemplateColumns: '100px 100px 1fr 1fr 110px 110px 110px 110px 48px',
            backgroundColor: 'var(--surface)',
            borderBottom: `0.8px solid var(--color-border)`
          }}>
            <button 
              onClick={() => handleColumnSort('po_number')}
              className="text-xs font-semibold uppercase tracking-wider text-left hover:opacity-75 transition-opacity flex items-center gap-1"
              style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              aria-label="Trier par numéro de bon de commande"
            >
              N° BC {renderSortIndicator('po_number')}
            </button>

            <button 
              onClick={() => handleColumnSort('po_date')}
              className="text-xs font-semibold uppercase tracking-wider text-left hover:opacity-75 transition-opacity flex items-center gap-1"
              style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              aria-label="Trier par date de bon de commande"
            >
              DATE BC {renderSortIndicator('po_date')}
            </button>

            <button 
              onClick={() => handleColumnSort('vendor_name')}
              className="text-xs font-semibold uppercase tracking-wider text-left hover:opacity-75 transition-opacity flex items-center gap-1"
              style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              aria-label="Trier par fournisseur"
            >
              FOURNISSEUR {renderSortIndicator('vendor_name')}
            </button>

            <button 
              onClick={() => handleColumnSort('project_number')}
              className="text-xs font-semibold uppercase tracking-wider text-left hover:opacity-75 transition-opacity flex items-center gap-1"
              style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              aria-label="Trier par affaire"
            >
              AFFAIRE {renderSortIndicator('project_number')}
            </button>

            <button 
              onClick={() => handleColumnSort('expected_delivery_date')}
              className="text-xs font-semibold uppercase tracking-wider text-left hover:opacity-75 transition-opacity flex items-center gap-1"
              style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              aria-label="Trier par date prévue de livraison"
            >
              D. PRÉVUE {renderSortIndicator('expected_delivery_date')}
            </button>

            <button 
              onClick={() => handleColumnSort('invoice_number')}
              className="text-xs font-semibold uppercase tracking-wider text-left hover:opacity-75 transition-opacity flex items-center gap-1"
              style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              aria-label="Trier par numéro de facture"
            >
              N° FACTURE {renderSortIndicator('invoice_number')}
            </button>

            <button 
              onClick={() => handleColumnSort('total_amount')}
              className="text-xs font-semibold uppercase tracking-wider text-left hover:opacity-75 transition-opacity flex items-center gap-1"
              style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              aria-label="Trier par montant"
            >
              MONTANT {renderSortIndicator('total_amount')}
            </button>

            <button 
              onClick={() => handleColumnSort('status')}
              className="text-xs font-semibold uppercase tracking-wider text-left hover:opacity-75 transition-opacity flex items-center gap-1"
              style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              aria-label="Trier par statut"
            >
              STATUT {renderSortIndicator('status')}
            </button>

            <span></span>
          </div>

          {/* Rows */}
          {loading ? (
            <div className="p-8 text-center loading-message">Chargement des bons de commande...</div>
          ) : sortedPOs.length === 0 ? (
            <div className="p-8 text-center empty-state">Aucun bon de commande trouvé.</div>
          ) : (
            sortedPOs.map((po: any) => {
              const st = getStatusDisplay(po.status);
              
              const dateStr = po.expected_delivery_date 
                ? new Date(po.expected_delivery_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : 'Non définie';

              return (
                <div
                   key={po.id}
                   className="grid items-center px-6 py-4 border-b border-gray-50 last:border-0 relative transition-colors hover:bg-[var(--surface-hover)]"
                   style={{ gridTemplateColumns: '100px 100px 1fr 1fr 110px 110px 110px 110px 48px' }}
                 >
                   <Link to={`/po/${po.id}`} className="font-bold text-sm hover:underline" style={{ color: 'var(--text-primary)' }}>
                     {po.po_number}
                   </Link>

                   <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                     {po.po_date 
                       ? new Date(po.po_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                       : new Date(po.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                   </span>

                   <div className="flex items-center gap-3 min-w-0">
                     <div className="flex flex-col min-w-0">
                       <Link 
                         to={`/fournisseur/${po.vendor_id}`} 
                         className="text-sm font-medium transition-colors truncate"
                         style={{ color: 'var(--text-primary)' }}
                         onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                         onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                       >
                         {po.vendor?.name || 'Fournisseur Inconnu'}
                       </Link>
                     </div>
                   </div>

                   <div className="flex flex-col">
                     <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{po.project_number || '-'}</span>
                     <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{po.project_type || ''}</span>
                   </div>

                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{dateStr}</span>

                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{po.invoice_number || '-'}</span>

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
                      className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
                      style={{ color: 'var(--text-tertiary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {menuOpenId === po.id && (
                      <div className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl z-[100] py-2" style={{ backgroundColor: 'var(--surface)', border: `0.8px solid var(--color-border)` }}>
                        <button 
                          onClick={() => navigate(`/po/modifier/${po.id}`)}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                          style={{ color: 'var(--text-primary)' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Edit className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
                          Modifier
                        </button>
                        <button 
                          onClick={(e) => handleDelete(po.id, e)}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                          style={{ color: 'var(--danger)' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--danger-bg)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
