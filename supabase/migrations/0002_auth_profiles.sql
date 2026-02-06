-- Adapt MVP - Auth Integration Migration
-- Migration: 0002_auth_profiles.sql
-- Description: Integrates profiles table with Supabase Auth and adds automatic profile creation trigger

-- =============================================================================
-- Rollback Instructions (if needed):
-- =============================================================================
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
-- ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
-- ALTER TABLE profiles ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS updated_at;

-- =============================================================================
-- A. Modify profiles table for auth integration
-- =============================================================================

-- Make org_id nullable (organization assignment happens post-auth)
ALTER TABLE profiles ALTER COLUMN org_id DROP NOT NULL;

-- Remove default UUID generation for id (will match auth.users.id)
ALTER TABLE profiles ALTER COLUMN id DROP DEFAULT;

-- Add updated_at column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
END $$;

-- Ensure email column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- Update role check constraint to have default
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'curator';

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email_lookup ON profiles(email) WHERE email IS NOT NULL;

-- =============================================================================
-- B. Create trigger function to auto-create profiles
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert new profile or update if exists (defensive)
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    org_id,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'role', 'curator'),
    NULL, -- org_id assigned later
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- =============================================================================
-- C. Trigger on auth.users (RUN MANUALLY IN SUPABASE DASHBOARD)
-- =============================================================================
-- NOTE: The following must be run in Supabase Dashboard → SQL Editor:
--
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.handle_new_user();
--
-- COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Triggers profile creation for new auth users';
-- =============================================================================

-- =============================================================================
-- D. Update app_meta
-- =============================================================================

UPDATE app_meta 
SET schema_version = '0002_auth_profiles',
    notes = 'Added auth integration with automatic profile creation'
WHERE id = 1;

-- =============================================================================
-- Migration Complete
-- =============================================================================

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates or updates profile when auth user is created';
