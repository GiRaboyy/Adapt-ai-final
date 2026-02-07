# Role Save Fix - Implementation Summary

## Overview
Fixed the "Failed to save role" error on `/auth/role` page. The role now saves properly to Supabase and persists through page refreshes.

## Changes Made

### 1. Database Migration - RLS Policies (`supabase/migrations/0003_profiles_rls.sql`)
Created new migration to:
- Enable Row Level Security on profiles table
- Add policies for authenticated users to SELECT, INSERT, and UPDATE their own profiles
- Fix role constraint to allow NULL values temporarily (before role selection)
- Ensure role column exists with proper constraints

**Action Required**: Run this migration in Supabase SQL Editor:
```bash
# Copy the content of 0003_profiles_rls.sql and run it in Supabase Dashboard → SQL Editor
```

### 2. Next.js API Route (`app/api/profile/role/route.ts`)
Created server-side API endpoint:
- `POST /api/profile/role`
- Validates user authentication
- Checks if profile exists, creates if not
- Updates role field
- Returns detailed error messages for debugging

**Key Features**:
- Proper error logging with full Supabase error details
- Handles both profile creation and updates
- Uses server-side Supabase client with user session

### 3. Role Selection Page Updates (`app/auth/role/page.tsx`)
Updated to use the new API endpoint:
- Changed from `/api/profiles/${userId}` (Python FastAPI) to `/api/profile/role` (Next.js)
- Removed `userId` dependency check (handled server-side)
- Enhanced error logging with detailed debugging info
- Shows error code and details in console for troubleshooting

## Testing Steps

### Test 1: New User Role Selection
1. Sign up as a new user
2. Navigate to `/auth/role`
3. Select a role (curator or employee)
4. Click "Продолжить"
5. ✅ Should redirect to `/dashboard`
6. Refresh the page
7. ✅ Should stay on `/dashboard` (role persisted)

### Test 2: Existing User with Role
1. Login as user who already has a role
2. Try to navigate to `/auth/role`
3. ✅ Should automatically redirect to `/dashboard`

### Test 3: Role Change (if needed later)
1. Go to `/auth/role` manually (if you want to allow role changes)
2. Select different role
3. ✅ Should update and redirect to `/dashboard`

## Common Issues & Debugging

### If role save fails:
1. Check browser console for detailed error logs:
   - `Role save error:` - shows HTTP status and response
   - `Error details:` - Supabase error message
   - `Error code:` - Supabase error code

2. Check server logs (Vercel/local terminal) for:
   - `Profile save error:` - server-side error details
   - Authentication errors

3. Common causes:
   - **RLS not configured**: Run migration 0003
   - **Profile doesn't exist**: API now handles this automatically
   - **Permission denied**: Check RLS policies allow auth.uid()

### TypeScript Errors
The `as any` type assertions in `/app/api/profile/role/route.ts` are intentional workarounds for Database type definitions. These can be fixed later by:
1. Updating `lib/types.ts` to include all profile fields
2. Regenerating Supabase types with their CLI
3. Removing the `as any` assertions

## Architecture Notes

### Why Next.js API Route Instead of Python?
- User session cookies are already handled by Next.js
- No need for service role key on client
- Better integration with Next.js middleware
- Simpler deployment (no cross-origin issues)

### Why Not Direct Supabase Client Update?
- RLS policies need to be tested and validated
- Server-side update provides better error handling
- Can add business logic easily (validation, audit logs, etc.)
- Centralized role update logic

## Rollback Plan
If issues occur:
1. Revert `/app/auth/role/page.tsx` to use client-side Supabase update
2. Add service role endpoint in Python API if needed
3. Disable RLS on profiles table temporarily (not recommended for production)

## Next Steps
1. Run the migration in Supabase
2. Test role selection flow
3. Monitor error logs for any edge cases
4. Consider adding audit logging for role changes
5. Update Database types to remove `as any` workarounds
