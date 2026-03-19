import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Loader2, Search, Plus, Mail, Package, Users, Award, Trash2 } from 'lucide-react';
import { PageHeader } from '../layout/PageHeader';
import { supabase } from '../../lib/supabase';
import { VendorForm } from './VendorForm';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

const statusMap: Record<string, { label: string; variant: 'actif' | 'integration' }> = {
  actif:       { label: 'ACTIF',       variant: 'actif' },
  integration: { label: 'INTÉGRATION', variant: 'integration' },
};

export function VendorView() {
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<any[]>([]);
  const [pos, setPos] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('vendors-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_orders' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vendorsRes, posRes] = await Promise.all([
        supabase.from('vendors').select('*').order('name'),
        supabase.from('purchase_orders').select('id, vendor_id, status')
      ]);

      if (vendorsRes.error) throw vendorsRes.error;
      setVendors(vendorsRes.data || []);
      setPos(posRes.data || []);
    } catch (err) {
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActivePOCount = (vendorId: string) => {
    return pos.filter(po => po.vendor_id === vendorId && (po.status === 'Commandé' || po.status === 'Partiel')).length;
  };

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: vendors.length,
    pendingPOs: pos.filter(po => po.status === 'Commandé' || po.status === 'Partiel').length,
    avgCompliance: Math.round(vendors.reduce((acc, v) => acc + (Number(v.performance_score) || 0), 0) / (vendors.length || 1))
  };

  const handleEdit = (vendor: any) => {
    setEditingVendor(vendor);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le fournisseur "${name}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === '23503') {
          alert("Impossible de supprimer ce fournisseur car des bons de commande y sont rattachés. Supprimez d'abord les commandes associées.");
        } else {
          throw error;
        }
      } else {
        fetchData();
      }
    } catch (err: any) {
      console.error('Error deleting vendor:', err);
      alert('Une erreur est survenue lors de la suppression.');
    }
  };

  const handleAdd = () => {
    setEditingVendor(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-500">
      <PageHeader
        title="Répertoire Fournisseurs"
        subtitle="Gérez et surveillez vos prestataires externes en temps réel"
        searchPlaceholder="Rechercher Fournisseurs..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="px-8 flex flex-col gap-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 border-l-4 border-emerald-500 hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-default">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--kpi-emerald-bg)', color: 'var(--kpi-emerald-color)' }}>
                <Users size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Fournisseurs</p>
                <h3 className="text-2xl font-black text-slate-800">{stats.total}</h3>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 w-fit px-2 py-0.5 rounded">
              <TrendingUp size={12} /> +2 nouveaux ce mois
            </div>
          </div>

          <div className="card p-6 border-l-4 border-amber-500 hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-default">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--kpi-amber-bg)', color: 'var(--kpi-amber-color)' }}>
                <Package size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">BC en Attente</p>
                <h3 className="text-2xl font-black text-slate-800">{stats.pendingPOs}</h3>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-amber-600 font-bold bg-amber-50 w-fit px-2 py-0.5 rounded">
              Attention immédiate requise
            </div>
          </div>

          <div className="card p-6 border-l-4 border-blue-500 hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-default">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--kpi-blue-bg)', color: 'var(--kpi-blue-color)' }}>
                <Award size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Performance Globale</p>
                <h3 className="text-2xl font-black text-slate-800">{stats.avgCompliance}%</h3>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-blue-600 font-bold bg-blue-50 w-fit px-2 py-0.5 rounded">
              <TrendingUp size={12} /> +1.4% vs T1
            </div>
          </div>
        </div>

        {/* Partners table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
              <span className="w-2 h-6 bg-emerald-500 rounded-full" />
              Répertoire Actif
            </h3>
            <Button 
              variant="primary"
              onClick={handleAdd}
              aria-label="Ajouter un nouveau fournisseur"
            >
              <Plus size={18} />
              Ajouter un Fournisseur
            </Button>
          </div>

          <div className="card overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Fournisseur</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Catégorie</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">BC Actifs</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Statut</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading && filteredVendors.length === 0 ? (
                    <tr>
                       <td colSpan={6} className="px-6 py-12 text-center">
                         <Loader2 className="loading-spinner h-8 w-8 mx-auto mb-2" />
                         <p className="loading-message">Chargement des fournisseurs...</p>
                       </td>
                     </tr>
                   ) : filteredVendors.map((v) => {
                     const st = statusMap[v.status] || statusMap.actif;
                     const initials = v.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                     
                     return (
                       <tr key={v.id} className="group hover-surface">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Link to={`/fournisseur/${v.id}`} className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs shadow-sm shadow-emerald-100 hover:bg-emerald-200 transition-colors">
                              {initials}
                            </Link>
                            <div>
                              <Link to={`/fournisseur/${v.id}`} className="text-sm font-bold text-slate-800 hover:text-emerald-600 transition-colors">
                                {v.name}
                              </Link>
                              <p className="text-[10px] font-medium text-slate-400">ID: {v.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-slate-700">{v.contact_name || 'Non spécifié'}</p>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                              <Mail size={10} />
                              {v.contact_email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-slate-600">{v.category || 'Général'}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-xs font-black p-2 rounded-lg ${getActivePOCount(v.id) > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                            {String(getActivePOCount(v.id)).padStart(2, '0')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </td>
                         <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEdit(v)}
                              aria-label={`Modifier le fournisseur ${v.name}`}
                            >
                              Modifier
                            </Button>
                            <Button 
                              variant="danger"
                              size="icon"
                              onClick={() => handleDelete(v.id, v.name)}
                              title="Supprimer"
                              aria-label={`Supprimer le fournisseur ${v.name}`}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!loading && filteredVendors.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="empty-state">Aucun fournisseur ne correspond à votre recherche</p>
                </div>
              )}
            </div>
            
            {/* Pagination Placeholder */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/30 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Affichage de {filteredVendors.length} fournisseurs
              </span>
              <div className="flex items-center gap-2">
                <button disabled className="btn-outline py-1 px-3 text-[10px] opacity-50 cursor-not-allowed">Précédent</button>
                <div className="flex items-center gap-1">
                  <button className="w-6 h-6 rounded bg-emerald-600 text-white text-[10px] font-bold shadow-sm shadow-emerald-200">1</button>
                </div>
                <button disabled className="btn-outline py-1 px-3 text-[10px] opacity-50 cursor-not-allowed">Suivant</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <VendorForm 
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchData}
          initialData={editingVendor}
        />
      )}
    </div>
  );
}
