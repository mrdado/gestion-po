-- ============================================================
-- Données de test — Exécutez dans Supabase > SQL Editor
-- APRÈS schema.sql et rls_policies.sql
-- ============================================================

-- Fournisseurs
INSERT INTO vendors (name, contact_email, avg_lead_time_days, performance_score)
VALUES
  ('ABC Maintenance Supplies', 'mark.s@abcsupplies.com', 5, 96),
  ('Bright Phase Electrical',  'albert@brightphase.com', 12, 88),
  ('HVAC Pro Solutions',       'robert@hvacpro.com',     8, 92);

-- Bons de commande
INSERT INTO purchase_orders (po_number, vendor_id, status, total_amount, expected_delivery_date)
VALUES
  ('PO-2026-001',
    (SELECT id FROM vendors WHERE name = 'ABC Maintenance Supplies'),
    'En préparation', 4750.01, '2026-04-01'),
  ('PO-2026-002',
    (SELECT id FROM vendors WHERE name = 'Bright Phase Electrical'),
    'En transit', 1250.00, '2026-03-25');

-- Articles du PO-2026-001
INSERT INTO po_items (po_id, description, quantity_ordered, quantity_received, unit_price)
VALUES
  ((SELECT id FROM purchase_orders WHERE po_number = 'PO-2026-001'),
    'Filtres HVAC Commerciaux', 12, 0, 45.00),
  ((SELECT id FROM purchase_orders WHERE po_number = 'PO-2026-001'),
    'Ampoules LED Industrielles', 5, 0, 120.00),
  ((SELECT id FROM purchase_orders WHERE po_number = 'PO-2026-001'),
    'Sections de Tuyaux en Cuivre', 20, 0, 85.00),
  ((SELECT id FROM purchase_orders WHERE po_number = 'PO-2026-001'),
    'Capteur de Sécurité Extérieur', 3, 0, 636.67);

-- Journal d'audit
INSERT INTO audit_logs (po_id, action, status_from, status_to, user_email)
VALUES
  ((SELECT id FROM purchase_orders WHERE po_number = 'PO-2026-001'),
    'Création du BC', NULL, 'En préparation', 'john.doe@company.com'),
  ((SELECT id FROM purchase_orders WHERE po_number = 'PO-2026-002'),
    'Création du BC', NULL, 'En préparation', 'john.doe@company.com'),
  ((SELECT id FROM purchase_orders WHERE po_number = 'PO-2026-002'),
    'Statut mis à jour', 'En préparation', 'En transit', 'logistics@company.com');
