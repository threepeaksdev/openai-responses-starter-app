-- Create tasks table
create table tasks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  status text not null check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date timestamp with time zone,
  priority text not null check (priority in ('low', 'medium', 'high')),
  tags text[],
  metadata jsonb default '{}'::jsonb
);

-- Enable RLS
alter table tasks enable row level security;

-- Create policies
create policy "Users can view their own tasks."
  on tasks for select
  using ( auth.uid() = user_id );

create policy "Users can create their own tasks."
  on tasks for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own tasks."
  on tasks for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own tasks."
  on tasks for delete
  using ( auth.uid() = user_id );

-- Create updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_tasks_updated_at
  before update on tasks
  for each row
  execute function update_updated_at_column(); 