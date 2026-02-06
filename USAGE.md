# Adapt MVP - Usage Guide

## Supabase Configuration

### Site URL
```
https://adapt-ai-final.vercel.app
```

### Redirect URLs (add all of these)
```
https://adapt-ai-final.vercel.app/auth/callback
```

## User Flows

### 1. Email/Password Signup

1. User visits `/auth`
2. Clicks "Sign up" tab
3. Fills in:
   - Full Name
   - Email
   - Password (min 8 characters)
   - Confirm Password
   - Selects role: **Curator** or **Employee**
4. Clicks "Create account"
5. **Check email view** appears (inline, same page)
6. User checks their email and clicks verification link
7. Link redirects to `/auth/callback`
8. Profile is created via API (bypasses RLS)
9. User is redirected to `/dashboard`

### 2. Email/Password Login

1. User visits `/auth`
2. Fills in Email and Password
3. Clicks "Login"
4. Redirected to `/dashboard`

### 3. Google OAuth Login

1. User visits `/auth`
2. Clicks "Continue with Google"
3. Completes Google authentication
4. Redirected to `/auth/callback`
5. Profile is created if doesn't exist (with role: curator)
6. User is redirected to `/dashboard`

## API Endpoints

### Health Checks
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | API health status |
| `/api/supabase/health` | GET | Database connectivity |
| `/api/storage/health` | GET | Storage bucket status |
| `/api/storage/test-upload` | POST | Test file upload |

### Profile Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/profiles/ensure` | POST | Create profile if not exists |
| `/api/profiles/{user_id}` | GET | Get user profile |
| `/api/profiles/{user_id}` | PATCH | Update user profile |

## Environment Variables

### Vercel (Production)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENVIRONMENT=production
```

### Local Development (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENVIRONMENT=local
GIT_SHA=local-dev
```

## Troubleshooting

### "permission denied for schema public"
The Python API uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS. Make sure:
1. You're using the **service_role** key (not anon key)
2. The key is correctly set in Vercel environment variables

### Profile creation fails
Profiles are created via `/api/profiles/ensure` which uses the service role key. Check:
1. API is deployed and accessible
2. Service role key is valid

### Google OAuth not working
1. Enable Google provider in Supabase Dashboard → Authentication → Providers
2. Add correct redirect URLs in Supabase URL Configuration
3. Configure Google Cloud Console with OAuth credentials

## Database Schema

### profiles table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (matches auth.users.id) |
| email | TEXT | User email |
| full_name | TEXT | User's full name |
| role | TEXT | 'curator' or 'employee' |
| org_id | UUID | Organization ID (nullable) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |
