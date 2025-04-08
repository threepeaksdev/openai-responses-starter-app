-- Create projects table
create table projects (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  
  -- Core Project Information
  title text not null,
  description text,
  status text not null check (status in ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  
  -- Dates
  start_date timestamp with time zone,
  due_date timestamp with time zone,
  completed_date timestamp with time zone,
  
  -- Project Details
  priority text check (priority in ('low', 'medium', 'high')),
  category text,
  
  -- Team and Collaboration
  team_members uuid[] references auth.users(id),
  contact_ids uuid[] references contacts(id),
  
  -- Organization
  tags text[],
  
  -- Custom Fields
  metadata jsonb default '{}'::jsonb
);

-- Enable RLS
alter table projects enable row level security;

-- Create policies
create policy "Users can view their own projects."
  on projects for select
  using ( auth.uid() = user_id );

create policy "Users can create their own projects."
  on projects for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own projects."
  on projects for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own projects."
  on projects for delete
  using ( auth.uid() = user_id );

-- Create updated_at trigger
create trigger update_projects_updated_at
  before update on projects
  for each row
  execute function update_updated_at_column(); 