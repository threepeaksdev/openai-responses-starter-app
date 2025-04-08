-- Add priority column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium';

-- Add check constraint to ensure valid priority values
ALTER TABLE projects ADD CONSTRAINT projects_priority_check 
  CHECK (priority IN ('low', 'medium', 'high'));

-- Set default value for existing rows
UPDATE projects SET priority = 'medium' WHERE priority IS NULL; 