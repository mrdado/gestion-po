import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { 
  Loader2, Upload, AlertCircle, CheckCircle2, 
  FileText, ChevronRight, X,
  Info
} from 'lucide-react';
import { Badge } from '../ui/Badge';

interface DataImporterProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportRow {
  po_number: string;
  vendor_name: string;
  article_description: string;
  project_number?: string;
  project_type?: string;
  total_amount: number;
  expected_delivery_date?: string;
  status: string;
  currency: string;
  internal_notes?: string;
}

interface ValidationResult {
  row: number;
  data: ImportRow;
  errors: string[];
  warnings: string[];
  vendorId?: string;
  isNewVendor: boolean;
}

export function DataImporter({ onClose, onSuccess }: DataImporterProps) {
  const [importing, setImporting] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [vendors, setVendors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');
  const [summary, setSummary] = useState({ total: 0, valid: 0, newVendors: 0 });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    const { data } = await supabase.from('vendors').select('id, name');
    if (data) {
      const mapping = data.reduce((acc: any, v) => ({ ...acc, [v.name.toLowerCase().trim()]: v.id }), {});
      setVendors(mapping);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      validateCSV(e.target.files[0]);
    }
  };

  const validateCSV = (file: File) => {
    setResults([]);
    setErrorStatus(null);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        const validatedData: ValidationResult[] = results.data.map((row: any, index: number) => {
          const errors: string[] = [];
          const warnings: string[] = [];
          
          const po_number = (row.po_number || row['N° BC'] || '').toString().trim();
          const vendor_name = (row.vendor_name || row['FOURNISSEUR'] || row['Fournisseur'] || '').toString().trim();
          const article_description = (row.article_description || row['ARTICLE'] || row['Article'] || row['Description'] || 'Article divers').toString().trim();
          const total_amount_raw = row.total_amount || row['MONTANT'] || row['Montant'] || '0';
          const total_amount = parseFloat(total_amount_raw.toString().replace(',', '.').replace(/[^-0-9.]/g, ''));
          
          // Normalize status
          let status = (row.status || row['STATUT'] || 'Commandé').trim();
          if (status.toLowerCase().includes('command')) status = 'Commandé';
          else if (status.toLowerCase().includes('recu') || status.toLowerCase().includes('reçu')) status = 'Reçu';
          else if (status.toLowerCase().includes('pay')) status = 'Payé';
          else if (status.toLowerCase().includes('factur')) status = 'Facturé';
          else if (status.toLowerCase().includes('partiel')) status = 'Partiel';
          else status = 'Commandé'; // Default safety

          if (!po_number) errors.push("N° BC manquant");
          if (!vendor_name) errors.push("Fournisseur manquant");
          if (isNaN(total_amount) || total_amount <= 0) errors.push("Montant invalide");

          const vendorId = vendors[vendor_name.toLowerCase().trim()];
          const isNewVendor = !vendorId;

          if (isNewVendor && vendor_name) {
            warnings.push(`Nouveau fournisseur: ${vendor_name}`);
          }

          // Normalize Date
          let dateStr = (row.expected_delivery_date || row['DATE PRÉVUE'] || '').toString().trim();
          const expected_delivery_date = dateStr || null;

          // Normalize Project Type
          let projectType = (row.project_type || '').toString().trim();
          const upperPT = projectType.toUpperCase();
          if (upperPT === 'RDI') projectType = 'RDI';
          else if (upperPT === 'FG') projectType = 'FG';
          else if (upperPT === 'COMM' || upperPT === 'COM') projectType = 'Comm';
          else projectType = ''; // Empty is fine (nullable)

          return {
            row: index + 2,
            data: {
              po_number,
              vendor_name,
              article_description,
              project_number: (row.project_number || row['AFFAIRE'] || '').toString().trim(),
              project_type: projectType,
              total_amount,
              expected_delivery_date,
              status,
              currency: (row.currency || 'EUR').toString().trim().toUpperCase(),
              internal_notes: (row.internal_notes || row['NOTES'] || row['COMMENTAIRES'] || row['Comments'] || '').toString().trim()
            },
            errors,
            warnings,
            vendorId,
            isNewVendor
          };
        });

        setResults(validatedData);
        setSummary({
          total: validatedData.length,
          valid: validatedData.filter(r => r.errors.length === 0).length,
          newVendors: validatedData.filter(r => r.isNewVendor && r.errors.length === 0).length
        });
        setStep('preview');
      }
    });
  };

  const handleImport = async () => {
    setImporting(true);
    setErrorStatus(null);
    try {
      const validRows = results.filter(r => r.errors.length === 0);
      if (validRows.length === 0) return;
      
      // 1. Handle New Vendors first
      const newVendorsNames = Array.from(new Set(validRows.filter(r => r.isNewVendor).map(r => r.data.vendor_name)));
      
      const vendorMapping = { ...vendors };
      
      if (newVendorsNames.length > 0) {
        const { data: createdVendors, error: vError } = await supabase
          .from('vendors')
          .insert(newVendorsNames.map(name => ({ name, status: 'actif' })))
          .select();
        
        if (vError) throw vError;
        
        createdVendors?.forEach(v => {
          vendorMapping[v.name.toLowerCase().trim()] = v.id;
        });
      }

      // 2. Prepare & Insert POs
      const poToInsert = validRows.map(r => ({
        po_number: r.data.po_number,
        vendor_id: vendorMapping[r.data.vendor_name.toLowerCase().trim()],
        project_number: r.data.project_number,
        project_type: r.data.project_type || null,
        total_amount: r.data.total_amount,
        expected_delivery_date: r.data.expected_delivery_date,
        status: r.data.status,
        currency: r.data.currency,
        internal_notes: r.data.internal_notes,
        created_at: new Date().toISOString()
      }));

      const { data: insertedPOs, error: poError } = await supabase
        .from('purchase_orders')
        .insert(poToInsert)
        .select();

      if (poError) {
        if (poError.code === '23505') throw new Error(`Doublon détecté: un bon de commande avec ce numéro existe déjà.`);
        throw poError;
      }

      // 3. Create PO Items (Line Items)
      if (insertedPOs && insertedPOs.length > 0) {
        const itemsToInsert = insertedPOs.map(po => {
          const originalRow = validRows.find(r => r.data.po_number === po.po_number);
          return {
            po_id: po.id,
            description: originalRow?.data.article_description || 'Article divers',
            quantity_ordered: 1,
            unit_price: po.total_amount,
            quantity_received: po.status === 'Payé' || po.status === 'Reçu' ? 1 : 0
          };
        });

        const { error: itemsError } = await supabase
          .from('po_items')
          .insert(itemsToInsert);
        
        if (itemsError) throw itemsError;
      }

      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error("Import failed:", err);
      setErrorStatus(err.message || "Une erreur inattendue est survenue.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <Upload className="text-emerald-600" size={24} />
              Importateur de Données
            </h2>
            <p className="text-sm text-slate-500 font-medium">Migrez vos BC depuis Excel en quelques clics</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {step === 'upload' && (
            <div className="h-full flex flex-col items-center justify-center gap-6">
              <div className="w-full max-w-md p-12 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center gap-4 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all cursor-pointer group relative">
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText size={32} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-700">Cliquez ou glissez votre CSV</p>
                  <p className="text-xs text-slate-400 mt-1">Format recommandé: UTF-8 CSV</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl">
                {['po_number', 'vendor_name', 'total_amount', 'project_number', 'status', 'article'].map(col => (
                  <div key={col} className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{col}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl max-w-lg">
                <Info size={18} className="text-amber-600 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  <strong>Note:</strong> Si un fournisseur n'existe pas dans l'application, il sera créé automatiquement lors de l'importation.
                </p>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              {/* Error Alert */}
              {errorStatus && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top duration-300">
                  <AlertCircle className="text-red-500 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-sm font-bold text-red-800">Échec de l'importation</h4>
                    <p className="text-xs text-red-600 mt-0.5 leading-relaxed">{errorStatus}</p>
                  </div>
                </div>
              )}
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div className="card p-4 flex flex-col gap-1 border-b-4 border-slate-400">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Lignes</span>
                  <span className="text-2xl font-black text-slate-800">{summary.total}</span>
                </div>
                <div className="card p-4 flex flex-col gap-1 border-b-4 border-emerald-500">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prêts à importer</span>
                  <span className="text-2xl font-black text-emerald-600">{summary.valid}</span>
                </div>
                <div className="card p-4 flex flex-col gap-1 border-b-4 border-amber-500">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nouveaux Fournisseurs</span>
                  <span className="text-2xl font-black text-amber-600">{summary.newVendors}</span>
                </div>
              </div>

              {/* Data Table Preview */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-3 border-b border-slate-100 w-16">Ligne</th>
                      <th className="px-4 py-3 border-b border-slate-100">BC</th>
                      <th className="px-4 py-3 border-b border-slate-100">Fournisseur</th>
                      <th className="px-4 py-3 border-b border-slate-100">Montant</th>
                      <th className="px-4 py-3 border-b border-slate-100">Statut</th>
                      <th className="px-4 py-3 border-b border-slate-100">Validation</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {results.slice(0, 50).map((r, i) => (
                      <tr key={i} className={`hover:bg-slate-50 transition-colors ${r.errors.length > 0 ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-3 border-b border-slate-50 font-medium text-slate-400">{r.row}</td>
                        <td className="px-4 py-3 border-b border-slate-50 font-bold text-slate-700">{r.data.po_number}</td>
                        <td className="px-4 py-3 border-b border-slate-50">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600 font-medium">{r.data.vendor_name}</span>
                            {r.isNewVendor && !r.errors.length && (
                              <Badge variant="secondary" className="scale-75 origin-left">Nouveau</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 border-b border-slate-50 font-black text-slate-800">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: r.data.currency }).format(r.data.total_amount)}
                        </td>
                        <td className="px-4 py-3 border-b border-slate-50">
                           <Badge variant="outline" className="opacity-60">{r.data.status}</Badge>
                        </td>
                        <td className="px-4 py-3 border-b border-slate-50">
                          {r.errors.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {r.errors.map((err, idx) => (
                                <span key={idx} className="text-[10px] font-bold text-red-500 flex items-center gap-1 uppercase">
                                  <AlertCircle size={10} /> {err}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 uppercase">
                              <CheckCircle2 size={12} /> Valide
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {results.length > 50 && (
                  <div className="p-3 text-center bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    + {results.length - 50} autres lignes...
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="h-full flex flex-col items-center justify-center gap-6 animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-100">
                <CheckCircle2 size={64} />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Importation Réussie !</h3>
                <p className="text-slate-500 font-medium mt-2">
                  {summary.valid} bons de commande ont été importés avec succès.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <Button variant="ghost" onClick={step === 'preview' ? () => setStep('upload') : onClose} disabled={importing}>
            {step === 'upload' ? 'Annuler' : 'Changer de fichier'}
          </Button>
          
          {step === 'preview' && (
            <Button 
              onClick={handleImport} 
              disabled={importing || summary.valid === 0}
              className="bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 px-8"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importation en cours...
                </>
              ) : (
                <>
                  Importer {summary.valid} lignes
                  <ChevronRight size={18} className="ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
