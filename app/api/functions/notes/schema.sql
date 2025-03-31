-- Create notes table
create table notes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  
  -- Core Note Content
  title text not null,
  content text not null,
  
  -- Relationships (Optional)
  contact_id uuid references contacts(id),
  task_id uuid references tasks(id),
  project_id uuid references projects(id),
  
  -- Categorization
  type text check (type in ('general', 'contact', 'task', 'project')),
  status text check (status in ('active', 'archived')),
  priority text check (priority in ('low', 'medium', 'high')),
  
  -- Organization
  tags text[],
  
  -- Custom Fields
  metadata jsonb default '{}'::jsonb
);

-- Enable RLS
alter table notes enable row level security;

-- Create policies
create policy "Users can view their own notes."
  on notes for select
  using ( auth.uid() = user_id );

create policy "Users can create their own notes."
  on notes for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own notes."
  on notes for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own notes."
  on notes for delete
  using ( auth.uid() = user_id );

-- Create updated_at trigger
create trigger update_notes_updated_at
  before update on notes
  for each row
  execute function update_updated_at_column(); 