export type Vendor = {
  id: string;
  name: string;
  contact_email: string | null;
  avg_lead_time_days: number;
  performance_score: number;
  created_at: string;
};

export type POStatus = 'Commandé' | 'Reçu' | 'Facturé' | 'Payé';

export type PurchaseOrder = {
  id: string;
  po_number: string;
  vendor_id: string;
  status: POStatus;
  total_amount: number;
  currency: string;
  expected_delivery_date: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  vendors?: Vendor; // Joined data
};

export type POItem = {
  id: string;
  po_id: string;
  description: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
  created_at: string;
};

export type AuditLog = {
  id: string;
  po_id: string;
  action: string;
  status_from: string | null;
  status_to: string | null;
  user_email: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  message: string;
  severity: 'warning' | 'info' | 'critical';
  po_id: string | null;
  is_read: boolean;
  created_at: string;
};
