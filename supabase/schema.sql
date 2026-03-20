-- Enable Realtime for these tables
begin;
  -- drop the publication if it exists
  drop publication if exists supabase_realtime;
  -- create the publication
  create publication supabase_realtime;
commit;

-- VENDORS table
create table vendors (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  contact_name text,
  contact_email text,
  category text,
  status text default 'actif' check (status in ('actif', 'integration')),
  avg_lead_time_days numeric default 0,
  performance_score numeric default 100,
  created_at timestamp with time zone default now()
);

-- PURCHASE ORDERS table
create table purchase_orders (
  id uuid primary key default uuid_generate_v4(),
  po_number text unique not null,
  vendor_id uuid references vendors(id),
  status text not null check (status in ('Commandé', 'Partiel', 'Reçu', 'Facturé', 'Payé')),
  total_amount numeric not null,
  currency text default 'EUR',
  expected_delivery_date date,
  internal_notes text,
  project_number text,
  project_type text check (project_type in ('RDI', 'FG', 'Comm')),
  invoice_number text,
  po_date date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- PO ITEMS table (for partial receipts)
create table po_items (
  id uuid primary key default uuid_generate_v4(),
  po_id uuid references purchase_orders(id) on delete cascade,
  description text not null,
  quantity_ordered numeric not null,
  quantity_received numeric default 0,
  unit_price numeric not null,
  created_at timestamp with time zone default now()
);

-- AUDIT LOGS table
create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  po_id uuid references purchase_orders(id) on delete cascade,
  action text not null,
  status_from text,
  status_to text,
  user_email text,
  created_at timestamp with time zone default now()
);

-- ALERTS/NOTIFICATIONS table
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  message text not null,
  severity text check (severity in ('warning', 'info', 'critical')),
  po_id uuid references purchase_orders(id),
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- Add tables to realtime publication
alter publication supabase_realtime add table purchase_orders, po_items, notifications, vendors;

-- RPC for marking all items received
create or replace function mark_all_items_received(p_po_id uuid)
returns void as $$
begin
  update po_items
  set quantity_received = quantity_ordered
  where po_id = p_po_id;
end;
$$ language plpgsql;
