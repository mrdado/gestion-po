import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { PageHeader } from '../layout/PageHeader';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '../ui/Table';
import { 
  Users, Mail, User, Tag, 
  ShoppingBag, DollarSign, Clock, 
  BarChart3, Loader2, ArrowLeft,
  Calendar, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<any>(null);
  const [pos, setPos] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSpend: 0,
    poCount: 0,
    avgLeadTime: 0,
    performance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchData();
      
      const vendorChannel = supabase
        .channel(`vendor-detail-${id}`)
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'vendors', 
            filter: `id=eq.${id}` 
        }, () => fetchData())
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'purchase_orders', 
            filter: `vendor_id=eq.${id}` 
        }, () => fetchData())
        .subscribe();

      return () => {
        supabase.removeChannel(vendorChannel);
      };
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Vendor
      const { data: vendorData, error: vError } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', id)
        .single();
      
      if (vError) throw vError;
      setVendor(vendorData);

      // 2. Fetch POs
      const { data: posData, error: poError } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('vendor_id', id)
        .order('created_at', { ascending: false });
      
      if (poError) throw poError;
      setPos(posData || []);

      // 3. Calculate Stats
      const totalSpend = posData?.reduce((sum, po) => sum + (po.total_amount || 0), 0) || 0;
      const poCount = posData?.length || 0;
      
      setStats({
        totalSpend,
        poCount,
        avgLeadTime: vendorData.avg_lead_time_days || 0,
        performance: vendorData.performance_score || 0
      });

    } catch (err) {
      console.error("Error fetching vendor details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[600px] flex-col items-center justify-center gap-4">
        <Loader2 className="loading-spinner h-10 w-10 text-emerald-600" />
        <p className="loading-message">Chargement des détails du fournisseur...</p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="p-8 text-center flex flex-col items-center gap-4">
        <div className="p-4 bg-red-50 text-red-600 rounded-full">
          <Users size={48} />
        </div>
        <p className="text-slate-500 font-medium">Fournisseur introuvable.</p>
        <Button variant="ghost" onClick={() => navigate('/fournisseurs')}>
           <ArrowLeft size={16} className="mr-2" /> Retour à la liste
        </Button>
      </div>
    );
  }

  const initials = vendor.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        title={vendor.name}
        subtitle={`Détails et historique du fournisseur`}
        backLink={{ label: 'Retour aux Fournisseurs', to: '/fournisseurs' }}
      />

      <div className="px-8 flex flex-col gap-8">
        {/* Header Info Card */}
        <div className="card p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
          
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="w-24 h-24 rounded-3xl bg-emerald-600 text-white flex items-center justify-center text-4xl font-black shadow-2xl shadow-emerald-600/20 uppercase">
              {initials}
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">{vendor.name}</h2>
                <Badge variant={vendor.status === 'actif' ? 'actif' : 'integration'}>
                  {vendor.status === 'actif' ? 'ACTIF' : 'INTÉGRATION'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contact</p>
                    <p className="text-sm font-semibold">{vendor.contact_name || '-'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</p>
                    <a href={`mailto:${vendor.contact_email}`} className="text-sm font-semibold hover:text-emerald-600 transition-colors">
                      {vendor.contact_email || '-'}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                    <Tag size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Catégorie</p>
                    <p className="text-sm font-semibold">{vendor.category || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6 border-l-4 border-emerald-500 hover-surface">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Dépenses Totales</p>
                <p className="text-xl font-black text-slate-800">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.totalSpend)}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6 border-l-4 border-blue-500 hover-surface">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <ShoppingBag size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Total Commandes</p>
                <p className="text-xl font-black text-slate-800">{stats.poCount}</p>
              </div>
            </div>
          </div>

          <div className="card p-6 border-l-4 border-amber-500 hover-surface">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Délai Moyen</p>
                <p className="text-xl font-black text-slate-800">{stats.avgLeadTime} jours</p>
              </div>
            </div>
          </div>

          <div className="card p-6 border-l-4 border-purple-500 hover-surface">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <BarChart3 size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Performance</p>
                <p className="text-xl font-black text-slate-800">{stats.performance}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* PO Table */}
        <div className="card overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <FileText size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Historique des Commandes</h3>
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° BC</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>N° Affaire</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pos.map((po) => (
                <TableRow key={po.id} className="hover-surface">
                  <TableCell className="font-bold text-slate-700">{po.po_number}</TableCell>
                  <TableCell className="text-slate-500">
                    <div className="flex items-center gap-2">
                       <Calendar size={14} className="text-slate-300" />
                       {format(new Date(po.created_at), 'dd MMM yyyy', { locale: fr })}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-600">{po.project_number || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={
                      po.status === 'Payé' ? 'payé' : 
                      po.status === 'Reçu' ? 'reçu' : 
                      po.status === 'Commandé' ? 'commandé' : 'partiel'
                    }>
                      {po.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-black text-slate-800">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(po.total_amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={`/po/${po.id}`}>
                      <Button variant="ghost" size="sm">Voir</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {pos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-400 italic">
                    Aucune commande trouvée pour ce fournisseur.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
