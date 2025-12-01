-- Add 'used' column to invites table if it doesn't exist
-- Run this SQL script directly in your database

-- Check if column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'invites' 
        AND column_name = 'used'
    ) THEN
        ALTER TABLE invites ADD COLUMN used BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'Column "used" added to invites table';
    ELSE
        RAISE NOTICE 'Column "used" already exists in invites table';
    END IF;
END $$;

-- If you have an 'accepted_at' column and want to migrate data:
-- UPDATE invites SET used = true WHERE accepted_at IS NOT NULL;

-- Optional: Drop accepted_at column if it exists and you don't need it
-- ALTER TABLE invites DROP COLUMN IF EXISTS accepted_at;

