-- Add profile_photo column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT;

-- Create index for faster queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_profile_photo ON users(id) WHERE profile_photo IS NOT NULL;
