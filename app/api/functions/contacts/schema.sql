-- Create contacts table
create table contacts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  
  -- Basic Information
  first_name text not null,
  last_name text not null,
  nickname text,
  email text,
  phone text,
  birthday date,
  
  -- Additional Details
  occupation text,
  company text,
  location text,
  
  -- Social Media
  linkedin text,
  twitter text,
  instagram text,
  
  -- Relationship Information
  relationship_status text check (relationship_status in ('friend', 'family', 'colleague', 'acquaintance', 'other')),
  met_at text,
  met_through text,
  
  -- Notes and Tags
  bio text,
  interests text[],
  tags text[],
  notes text,
  
  -- Custom Fields
  metadata jsonb default '{}'::jsonb
);

-- Enable RLS
alter table contacts enable row level security;

-- Create policies
create policy "Users can view their own contacts."
  on contacts for select
  using ( auth.uid() = user_id );

create policy "Users can create their own contacts."
  on contacts for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own contacts."
  on contacts for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own contacts."
  on contacts for delete
  using ( auth.uid() = user_id );

-- Create updated_at trigger
create trigger update_contacts_updated_at
  before update on contacts
  for each row
  execute function update_updated_at_column(); 