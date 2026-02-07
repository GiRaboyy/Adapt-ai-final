-- Migration: 0002_allow_null_role_org.sql
-- Description: Allow NULL for role and org_id during initial signup flow
-- The role is selected after email confirmation, and org_id is set later

-- Drop the NOT NULL constraint on org_id
ALTER TABLE profiles ALTER COLUMN org_id DROP NOT NULL;

-- Drop the NOT NULL and CHECK constraint on role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ALTER COLUMN role DROP NOT NULL;

-- Re-add CHECK constraint but allow NULL values
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IS NULL OR role IN ('curator', 'employee'));

-- Update schema version
UPDATE app_meta 
SET schema_version = '0002_allow_null_role_org', 
    notes = 'Allow NULL for role and org_id during signup flow'
WHERE id = 1;
