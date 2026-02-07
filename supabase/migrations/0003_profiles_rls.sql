-- Adapt MVP - Profiles RLS Policies
-- Migration: 0003_profiles_rls.sql
-- Description: Adds Row Level Security policies for profiles table and ensures role column exists

-- =============================================================================
-- A. Ensure role column exists (defensive)
-- =============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT;

-- Update the check constraint to allow role to be NULL temporarily
-- (for new signups before role selection)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IS NULL OR role IN ('curator', 'employee'));

-- =============================================================================
-- B. Enable Row Level Security
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- C. RLS Policies for profiles table
-- =============================================================================

-- Policy: Users can read their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Policy: Users can insert their own profile
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- =============================================================================
-- D. Update app_meta
-- =============================================================================

UPDATE app_meta 
SET schema_version = '0003_profiles_rls',
    notes = 'Added RLS policies for profiles table and fixed role constraint'
WHERE id = 1;

-- =============================================================================
-- Migration Complete
-- =============================================================================

COMMENT ON POLICY "profiles_select_own" ON public.profiles IS 'Users can read their own profile';
COMMENT ON POLICY "profiles_insert_own" ON public.profiles IS 'Users can create their own profile';
COMMENT ON POLICY "profiles_update_own" ON public.profiles IS 'Users can update their own profile';
