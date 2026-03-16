-- ============================================================
-- Politiques RLS (Row Level Security) – Mode Développement
-- Exécutez ce fichier dans Supabase > SQL Editor APRÈS schema.sql
-- ============================================================

-- Activer RLS sur chaque table
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Autoriser toutes les opérations (lecture + écriture) — DEV UNIQUEMENT
CREATE POLICY "Allow all for dev" ON vendors FOR ALL USING (true);
CREATE POLICY "Allow all for dev" ON purchase_orders FOR ALL USING (true);
CREATE POLICY "Allow all for dev" ON po_items FOR ALL USING (true);
CREATE POLICY "Allow all for dev" ON audit_logs FOR ALL USING (true);
CREATE POLICY "Allow all for dev" ON notifications FOR ALL USING (true);
