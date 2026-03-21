-- ============================================================
-- Authentication & Profiles Schema
-- Exécutez ce fichier dans Supabase > SQL Editor
-- ============================================================

-- 1. Create the custom profiles table
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  is_approved boolean default false,
  role text default 'user',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Enable RLS on profiles
alter table profiles enable row level security;

-- 2.5 Security Definer Function to avoid RLS Infinite Recursion
create or replace function public.is_admin()
returns boolean as $$
declare
  status boolean;
begin
  select (role = 'admin') into status from public.profiles where id = auth.uid();
  return coalesce(status, false);
end;
$$ language plpgsql security definer set search_path = public;

-- 3. RLS Policies for profiles
-- Users can read their own profile
create policy "Users can view own profile" 
on profiles for select 
using ( auth.uid() = id );

-- Admins can view all profiles
create policy "Admins can view all profiles" 
on profiles for select 
using ( public.is_admin() );

-- Admins can update profiles (e.g., to approve users)
create policy "Admins can update profiles" 
on profiles for update 
using ( public.is_admin() );

-- 4. Create trigger function to automatically create a profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, is_approved, role)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    false, -- Requires admin approval
    'user'
  );
  return new;
end;
$$ language plpgsql security definer;

-- 5. Attach the trigger to Supabase Auth
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Update Realtime to include profiles (so Admin UI updates instantly)
alter publication supabase_realtime add table profiles;

-- ============================================================
-- IMPORTANT: Update existing App RLS (Run these instead of the old 'dev' policies)
-- ============================================================

-- Drop the old permissive "dev" policies if they exist (ignore errors if they don't)
drop policy if exists "Allow all for dev" on purchase_orders;
drop policy if exists "Allow all for dev" on vendors;
drop policy if exists "Allow all for dev" on po_items;
drop policy if exists "Allow all for dev" on audit_logs;

-- Re-create app policies: Only approved users can read/write app data

-- Purchase Orders
create policy "Approved users access POs" on purchase_orders for all 
using ( exists (select 1 from profiles where id = auth.uid() and is_approved = true) );

-- Vendors
create policy "Approved users access Vendors" on vendors for all 
using ( exists (select 1 from profiles where id = auth.uid() and is_approved = true) );

-- PO Items
create policy "Approved users access PO Items" on po_items for all 
using ( exists (select 1 from profiles where id = auth.uid() and is_approved = true) );

-- Audit Logs
create policy "Approved users access Audit Logs" on audit_logs for all 
using ( exists (select 1 from profiles where id = auth.uid() and is_approved = true) );
