-- 1. Create the Bugs Table (With inline checks)
create table bug_reports (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  
  -- Link to the user
  user_id uuid references auth.users(id) not null,
  
  -- The Core Report
  title text not null,
  description text not null,
  steps_to_reproduce text, 
  
  -- Metadata with INLINE CHECKS
  severity text default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  status text default 'open' check (status in ('open', 'in_progress', 'resolved', 'wont_fix')),
  
  -- Auto-captured info
  device_metadata jsonb
);

-- 2. Enable Security
alter table bug_reports enable row level security;

-- 3. Create Policies

-- Policy A: Users can submit bugs
create policy "Users can report bugs"
on bug_reports for insert
to authenticated
with check ( auth.uid() = user_id );

-- Policy B: Users can view their own bugs
create policy "Users can view their own bugs"
on bug_reports for select
to authenticated
using ( auth.uid() = user_id );
