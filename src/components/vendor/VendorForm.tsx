import React, { useState } from 'react';
import type { CSSProperties } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';

interface VendorFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export function VendorForm({ onClose, onSuccess, initialData }: VendorFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    contact_name: initialData?.contact_name || '',
    contact_email: initialData?.contact_email || '',
    category: initialData?.category || '',
    status: initialData?.status || 'actif'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (initialData?.id) {
        const { error: updateError } = await supabase
          .from('vendors')
          .update(formData)
          .eq('id', initialData.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('vendors')
          .insert([formData]);
        if (insertError) throw insertError;
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800">
            {initialData ? 'Modifier le Fournisseur' : 'Ajouter un Fournisseur'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200/50 rounded-full transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1" htmlFor="vendor-name">Nom de l'entreprise</label>
            <input
              required
              id="vendor-name"
              type="text"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-offset-2 focus:border-slate-400 transition-all text-sm outline-none"
              placeholder="Ex: Swift Janitorial Inc."
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              aria-label="Nom de l'entreprise du fournisseur"
              style={{ '--tw-ring-color': 'var(--accent)' } as CSSProperties}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1" htmlFor="contact-name">Contact Principal</label>
              <input
                required
                id="contact-name"
                type="text"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-offset-2 focus:border-slate-400 transition-all text-sm outline-none"
                placeholder="Prénom Nom"
                value={formData.contact_name}
                onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                aria-label="Nom du contact principal du fournisseur"
                style={{ '--tw-ring-color': 'var(--accent)' } as CSSProperties}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1" htmlFor="contact-email">Email de contact</label>
              <input
                required
                id="contact-email"
                type="email"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-offset-2 focus:border-slate-400 transition-all text-sm outline-none"
                placeholder="contact@exemple.com"
                value={formData.contact_email}
                onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                aria-label="Email de contact du fournisseur"
                style={{ '--tw-ring-color': 'var(--accent)' } as CSSProperties}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1" htmlFor="vendor-category">Catégorie</label>
            <input
              id="vendor-category"
              type="text"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-offset-2 focus:border-slate-400 transition-all text-sm outline-none"
              placeholder="Ex: Maintenance Électrique"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              aria-label="Catégorie du fournisseur"
              style={{ '--tw-ring-color': 'var(--accent)' } as CSSProperties}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1" htmlFor="vendor-status">Statut</label>
            <select
              id="vendor-status"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-offset-2 focus:border-slate-400 transition-all text-sm outline-none appearance-none"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              aria-label="Statut du fournisseur"
              style={{ '--tw-ring-color': 'var(--accent)' } as CSSProperties}
            >
              <option value="actif">Actif</option>
              <option value="integration">En intégration</option>
            </select>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              aria-label="Annuler"
            >
              Annuler
            </Button>
            <Button
              disabled={loading}
              type="submit"
              variant="primary"
              aria-label={initialData ? 'Mettre à jour le fournisseur' : 'Enregistrer le fournisseur'}
            >
              {loading && <Loader2 size={16} className="loading-spinner" />}
              {initialData ? 'Mettre à jour' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
