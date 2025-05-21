-- Add favorites column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS favorites INTEGER[] DEFAULT '{}';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_favorites ON users USING GIN (favorites); 