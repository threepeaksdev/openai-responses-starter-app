-- Add tags column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tags text[];

-- Update RLS policies to include the new column
DROP POLICY IF EXISTS "Users can view their own projects." ON projects;
DROP POLICY IF EXISTS "Users can create their own projects." ON projects;
DROP POLICY IF EXISTS "Users can update their own projects." ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects." ON projects;

CREATE POLICY "Users can view their own projects."
  ON projects FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can create their own projects."
  ON projects FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update their own projects."
  ON projects FOR UPDATE
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can delete their own projects."
  ON projects FOR DELETE
  USING ( auth.uid() = user_id ); 