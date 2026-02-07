# Adapt MVP - AI-Powered Training Platform

Adapt is a B2B web service (MVP) that enables automatic generation of training courses based on company internal knowledge. This Stage 1 implementation provides a production-ready skeleton with Vercel deployment and Supabase integration.

## Project Overview

### What is Adapt?

Adapt automates employee onboarding and upskilling by:
- **Knowledge Upload**: Curators upload company documents (TXT, DOCX, PDF)
- **AI Generation**: Alice AI analyzes content and creates interactive questions (quiz + open-ended)
- **Employee Training**: Employees access courses via unique codes and complete training
- **Analytics Dashboard**: Curators track progress, results, and identify problem areas

### Stage 1 Objectives

This stage delivers:
- ✅ Next.js frontend with App Router and Tailwind CSS
- ✅ Python FastAPI backend as Vercel serverless function
- ✅ Supabase Postgres database with complete schema
- ✅ Supabase Storage for file management
- ✅ Health check endpoints and status dashboard
- ✅ Automatic deployment via Vercel + GitHub integration
- ✅ CI/CD pipeline with code quality checks

## Prerequisites

Before you begin, ensure you have:

- **Node.js**: v18.17 or higher
- **Python**: 3.12 (specified in `.python-version`)
- **Supabase CLI**: [Installation guide](https://supabase.com/docs/guides/cli)
- **Vercel CLI**: `npm install -g vercel`
- **Git**: For version control

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Adapt-ai-final
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your Supabase credentials:

```env
# Public variables (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Server-only variables (never exposed to browser)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Environment identifier
ENVIRONMENT=local

# Git commit SHA (optional, auto-injected by Vercel)
GIT_SHA=local-dev
```

**Where to find Supabase credentials:**
1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Navigate to Settings > API
4. Copy `Project URL` and API keys

### 3. Install Dependencies

**Node.js dependencies:**
```bash
npm install
```

**Python dependencies:**
```bash
pip install -r requirements.txt
```

### 4. Link Supabase Project

Initialize Supabase and link to your remote project:

```bash
supabase link --project-ref <project-id>
```

The `project-id` can be found in your Supabase project URL: `https://app.supabase.com/project/<project-id>`

### 5. Apply Database Migrations

Push the initial schema to your Supabase database:

```bash
supabase db push
```

This will:
- Create all necessary tables (organizations, profiles, courses, etc.)
- Set up indexes and constraints
- Insert initial metadata

Verify in Supabase Dashboard:
- Navigate to Table Editor
- Confirm all tables are visible

### 6. Run Development Server

Start the development server (both Next.js and Python functions):

```bash
vercel dev
```

or alternatively:

```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api/*

### 7. Verify Installation

Open http://localhost:3000/status in your browser.

You should see:
- ✅ API Health: OK
- ✅ Database Connectivity: OK (if migrations applied)
- ✅ Storage Bucket: OK (bucket created automatically)
- ✅ Test Upload: OK

## Vercel Deployment Setup

### 1. Push to GitHub

Create a new GitHub repository and push your code:

```bash
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main
```

### 2. Import Project in Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js configuration

### 3. Configure Environment Variables

In Vercel project settings, add the following environment variables:

**For Production:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENVIRONMENT=production
```

**For Preview:**
```
(same as production, or use separate Supabase project)
ENVIRONMENT=preview
```

### 4. Deploy

Vercel will automatically deploy when you:
- Push to `main` branch → Production deployment
- Open a Pull Request → Preview deployment

### 5. Verify Production Deployment

After deployment completes:

1. Visit your deployment URL: `https://your-project.vercel.app`
2. Navigate to `/status` page
3. Verify all health checks pass

Or use the verification script:

```bash
./scripts/verify_prod.sh https://your-project.vercel.app
```

## Project Structure

```
/
├── app/                      # Next.js App Router
│   ├── globals.css          # Global styles with Tailwind
│   ├── layout.tsx           # Root layout component
│   ├── page.tsx             # Home page
│   └── status/
│       └── page.tsx         # Health check dashboard
├── components/              # Reusable React components
├── lib/
│   └── supabaseClient.ts   # Supabase client (future use)
├── api/                     # Python FastAPI backend
│   ├── index.py            # Main API entrypoint
│   └── _lib/
│       ├── settings.py     # Environment configuration
│       └── supabase_admin.py # Admin database client
├── supabase/
│   └── migrations/
│       └── 0001_init.sql   # Initial database schema
├── scripts/
│   ├── verify_local.sh     # Local health check script
│   └── verify_prod.sh      # Production health check script
├── .github/
│   └── workflows/
│       └── ci.yml          # CI/CD pipeline
├── .env.example            # Environment template
├── .gitignore              # Git ignore patterns
├── .python-version         # Python version (3.12)
├── package.json            # Node dependencies
├── requirements.txt        # Python dependencies
└── README.md               # This file
```

### Key Directories

- **`app/`**: Next.js pages and components using App Router
- **`api/`**: FastAPI backend functions (deployed as Vercel serverless)
- **`supabase/migrations/`**: SQL migration files for database schema
- **`scripts/`**: Utility scripts for testing and verification

## Running Health Checks

### Local Environment

Check all health endpoints locally:

```bash
./scripts/verify_local.sh
```

This will test:
- `/api/health` - Basic API functionality
- `/api/supabase/health` - Database connectivity
- `/api/storage/health` - Storage bucket access
- `/api/storage/test-upload` - File upload capability

### Production Environment

Check production deployment:

```bash
./scripts/verify_prod.sh https://your-deployment.vercel.app
```

## Database Migration Management

### Creating New Migrations

1. Create a new SQL file in `supabase/migrations/`:
   ```bash
   touch supabase/migrations/0002_add_feature.sql
   ```

2. Write your migration SQL (DDL statements)

3. Apply to remote database:
   ```bash
   supabase db push
   ```

### Migration Naming Convention

- Format: `NNNN_description.sql`
- Example: `0001_init.sql`, `0002_add_auth.sql`
- Numbers are sequential and zero-padded

### Best Practices

- ✅ Always test migrations locally first
- ✅ Make migrations idempotent (use `IF NOT EXISTS`)
- ✅ Never modify applied migrations
- ✅ Include rollback instructions in comments
- ✅ Use descriptive names and comments

## API Endpoints

### Health Check Endpoints

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/api/health` | GET | Basic API health | `{ ok, build, env }` |
| `/api/supabase/health` | GET | Database connectivity | `{ ok, message, latency_ms }` |
| `/api/storage/health` | GET | Storage bucket status | `{ ok, bucket, objects_count }` |
| `/api/storage/test-upload` | POST | Test file upload | `{ ok, bucket, path }` |

### Example Requests

**Check API Health:**
```bash
curl http://localhost:3000/api/health
```

**Check Database:**
```bash
curl http://localhost:3000/api/supabase/health
```

**Test File Upload:**
```bash
curl -X POST http://localhost:3000/api/storage/test-upload
```

## Database Schema

### Core Tables

- **`app_meta`**: System metadata and health checks
- **`organizations`**: Company/organization entities
- **`profiles`**: User profiles (curators and employees)
- **`courses`**: Training courses with metadata
- **`course_items`**: Individual questions within courses
- **`enrollments`**: Employee course assignments
- **`answers`**: Student responses to questions
- **`promo_codes`**: Promotional codes for access
- **`org_usage`**: Organization usage tracking
- **`documents`**: Uploaded file metadata

See `supabase/migrations/0001_init.sql` for complete schema definition.

## Storage Buckets

### adapt-files Bucket

- **Visibility**: Private
- **Size Limit**: 50 MB per file
- **Allowed Types**: 
  - `text/plain` (TXT)
  - `application/pdf` (PDF)
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX)
  - `audio/webm` (voice recordings)
  - `audio/mpeg` (audio files)

The bucket is automatically created by the `/api/storage/health` endpoint if it doesn't exist.

## Continuous Integration

The CI pipeline runs on every push and pull request:

**Node.js Checks:**
- Dependency installation
- Linting (`npm run lint`)
- Type checking (`npm run typecheck`)
- Build verification (`npm run build`)

**Python Checks:**
- Dependency installation
- Syntax validation (`python -m compileall`)

See `.github/workflows/ci.yml` for configuration.

## Environment Variables Reference

### Public Variables (Browser-accessible)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |

### Server-only Variables (Backend)

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key (bypasses RLS) | `eyJhbGc...` |
| `ENVIRONMENT` | Environment identifier | `local`, `preview`, `production` |
| `GIT_SHA` | Git commit hash | Auto-injected by Vercel |

## Troubleshooting

### "Database query failed" Error

**Cause**: Migrations haven't been applied.

**Solution**:
```bash
supabase db push
```

### "Configuration error: SUPABASE_URL must be set"

**Cause**: Missing environment variables.

**Solution**: 
1. Check `.env.local` exists
2. Verify all required variables are set
3. Restart `vercel dev`

### Python Dependencies Not Found

**Cause**: Virtual environment or missing packages.

**Solution**:
```bash
pip install -r requirements.txt
```

### Storage Bucket Creation Failed

**Cause**: Service role key doesn't have admin permissions.

**Solution**: Verify you're using `SUPABASE_SERVICE_ROLE_KEY`, not anon key.

## Development Commands

```bash
# Start development server
vercel dev

# Run Next.js only
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Type check
npm run typecheck

# Apply database migrations
supabase db push

# Check Python syntax
python -m compileall api/
```

## Contributing

This is Stage 1 of the Adapt MVP. Future stages will add:
- User authentication (Google OAuth)
- AI training generation (Alice AI integration)
- Course management UI
- Employee training interface
- Analytics dashboard

## License

[Your License Here]

## Support

For issues or questions:
- Open a GitHub issue
- Contact: [your-email@example.com]

---

**Stage 1 Complete** ✅

---

## Stage 2: Authentication & Role Management

Stage 2 adds complete authentication and role-based access control to Adapt.

### Auth Setup

Before using authentication locally or in production, configure Supabase Auth settings:

#### 1. Enable Email Provider

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable "Email" provider
3. Enable "Confirm email" option
4. Customize email templates (optional)

#### 2. Enable Google OAuth

**IMPORTANT:** To fix the `redirect_uri_mismatch` error, follow these steps carefully:

**Step 1: Create Google Cloud OAuth Credentials**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Navigate to APIs & Services → Credentials
4. Create OAuth 2.0 Client ID (Web application)

**Step 2: Configure Authorized Redirect URI in Google Cloud**

> This is the critical step! Google OAuth redirects to **Supabase**, not your app directly.

1. In OAuth 2.0 Client ID settings, add this Authorized redirect URI:

```
https://<PROJECT_REF>.supabase.co/auth/v1/callback
```

Replace `<PROJECT_REF>` with your Supabase project reference ID.
Find it in your Supabase project URL: `https://app.supabase.com/project/<PROJECT_REF>`

**Example:** If your project URL is `https://app.supabase.com/project/suicubrscstxnniaraxh`, add:
```
https://suicubrscstxnniaraxh.supabase.co/auth/v1/callback
```

2. (Optional) Also add with trailing slash:
```
https://<PROJECT_REF>.supabase.co/auth/v1/callback/
```

3. Save changes.

**Step 3: Configure Supabase**

1. Go to Supabase Dashboard → Authentication → Providers → Google
2. Enable Google provider
3. Paste your Google Client ID and Client Secret
4. Save

**Step 4: Configure Supabase Redirect URLs**

Go to Authentication → URL Configuration:

1. Set **Site URL** to your production domain:
```
https://your-domain.vercel.app
```

2. Add **Redirect URLs** (these are where Supabase redirects after auth):
```
http://localhost:3000/auth/callback
https://your-domain.vercel.app/auth/callback
```

### Quick Checklist for Google OAuth

- [ ] Google Cloud: OAuth 2.0 Client ID created
- [ ] Google Cloud: Redirect URI = `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
- [ ] Supabase: Google provider enabled with Client ID/Secret
- [ ] Supabase: Site URL set to production domain
- [ ] Supabase: Redirect URLs include `/auth/callback` for all environments

### Auth Features

- ✅ Email/password signup with email confirmation
- ✅ Email/password login
- ✅ Google OAuth authentication
- ✅ Role selection during signup (Curator/Employee)
- ✅ Default role to "curator" for OAuth users
- ✅ Email verification with resend capability
- ✅ Protected routes with middleware
- ✅ Role-based dashboard content
- ✅ Session management with httpOnly cookies
- ✅ Profile creation via Python API (bypasses RLS)

### Troubleshooting Auth Issues

**`redirect_uri_mismatch` error:**

1. Open browser DevTools → Network tab
2. Click "Sign in with Google"
3. Look at the failing request URL → Find `redirect_uri` parameter
4. Make sure that exact URI is in Google Cloud Console Authorized redirect URIs
5. Usually it should be: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`

**"Redirect URL not allowed" error:**

- Check that `/auth/callback` URL is added to Supabase Redirect URLs list
- Verify URL matches exactly (including http/https and port)

**Email confirmation not working:**

- Check email confirmations are enabled in Supabase
- Look for email in spam folder
- Try resend button after 60 seconds

**Can't access dashboard after login:**

- Check browser console for errors
- Verify migrations are applied: `supabase db push`

---

**Stage 2 Complete** ✅

Next: Stage 3 - Course Generation & AI Integration
