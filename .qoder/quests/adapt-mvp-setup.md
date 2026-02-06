# Adapt MVP - Stage 1: Project Setup & Production Deployment

## Project Overview

Adapt is a B2B web service (MVP) that enables automatic generation of training courses based on company internal knowledge. A curator (manager or HR) uploads knowledge base files (TXT, DOCX, PDF), and the AI system ("Alice AI") analyzes content and generates two types of questions: quiz questions (multiple choice with 4 options) and open questions (free text responses). The generated training is saved in the database and can be exported for offline use. Curators receive a unique code or link to share with employees, who then authenticate, enter the code, and complete the course. Curators can view analytics including progress, results, problematic topics, and success rates.

**Stage 1 Goal**: Build production-ready MVP skeleton with Vercel deployment and Supabase integration (Postgres + Storage). After any push, the application automatically deploys to Vercel (Preview + Production), and the production deployment passes e2e health checks: UI opens, API is live, Supabase is connected, Storage bucket is created, and test upload works.

## Core Requirements

### Mandatory Constraints

| Requirement | Description |
|-------------|-------------|
| Single Repository | Next.js frontend + Python FastAPI backend as Vercel serverless function |
| Environment Strategy | `.env.example` template, `.env.local` (gitignored), Vercel environment variables for Preview/Production |
| Auto-deployment | GitHub repository connected to Vercel triggers deployment on every push |
| Supabase Integration | SQL migrations in repository, private Storage bucket, API endpoints for DB/Storage verification, UI status page with health checks |
| Backend Architecture | Python functions in root `api/` folder (NOT Next.js `pages/api` or `app/api`) to avoid routing conflicts |
| Local Development | Use `vercel dev` to run both Next.js and Python functions simultaneously |
| Iterative Approach | Small commits, no breaking changes, incremental progress |

## System Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js (App Router) + Tailwind CSS | User interface, server-side rendering |
| Backend | Python FastAPI (Vercel Serverless) | API endpoints, business logic |
| Database | Supabase Postgres | Relational data storage |
| File Storage | Supabase Storage | Document and media file storage |
| Deployment | Vercel | Hosting, CI/CD, serverless functions |
| Version Control | GitHub | Source control, deployment trigger |

### Frontend Architecture

The frontend consists of Next.js pages using the App Router pattern with Tailwind for styling.

#### Status Page (`/status`)

The status page provides comprehensive health monitoring by calling backend endpoints and displaying results.

**Health Check Endpoints Called**:
- `GET /api/health` - Basic API availability check
- `GET /api/supabase/health` - Database connectivity verification
- `GET /api/storage/health` - Storage bucket availability check
- `POST /api/storage/test-upload` - Test file upload functionality

**Display Requirements**:
- Status indicator (OK/FAIL) for each check
- Response latency measurement
- Error messages when checks fail
- Visual styling with color coding (green for success, red for failure)

### Backend Architecture

FastAPI application deployed as Vercel serverless function (ASGI app).

#### API Endpoints Specification

| Endpoint | Method | Purpose | Response Schema |
|----------|--------|---------|-----------------|
| `/api/health` | GET | Basic health check | `{ ok: boolean, build: string, env: string }` |
| `/api/supabase/health` | GET | Database connectivity test | `{ ok: boolean, message: string, latency_ms: number }` |
| `/api/storage/health` | GET | Storage bucket verification | `{ ok: boolean, bucket: string, objects_count: number }` |
| `/api/storage/test-upload` | POST | Test file upload | `{ ok: boolean, bucket: string, path: string }` |

#### Endpoint Behavior Details

**`GET /api/health`**
- Returns application build information
- Includes environment identifier (local/preview/production)
- Uses GIT_SHA environment variable for build tracking
- Always returns HTTP 200 with JSON payload

**`GET /api/supabase/health`**
- Executes simple database query (e.g., `SELECT * FROM app_meta LIMIT 1`)
- Measures query execution time
- Returns connection status and latency
- Catches and reports database errors

**`GET /api/storage/health`**
- Checks if bucket `adapt-files` exists
- Creates bucket if missing (idempotent operation)
- Lists 1-5 objects to verify read access
- Returns bucket status and object count

**`POST /api/storage/test-upload`**
- Generates timestamped file path: `healthcheck/<iso_timestamp>.txt`
- Uploads small text content to bucket
- Verifies upload success
- Returns bucket name and file path

### Supabase Integration

#### Database Schema

The database schema supports organizations, users, courses, enrollments, and file management.

**A. System Tables**

`app_meta`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | integer | PRIMARY KEY, DEFAULT 1 | Single row identifier |
| created_at | timestamptz | DEFAULT now() | Initialization timestamp |
| schema_version | text | - | Migration version tracking |
| notes | text | NULLABLE | Administrative notes |

Purpose: Simple table for database health checks and schema versioning.

**B. Organizations and Profiles**

`organizations`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | uuid | PRIMARY KEY | Organization identifier |
| name | text | NOT NULL | Organization name |
| created_at | timestamptz | DEFAULT now() | Registration timestamp |

`profiles`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | uuid | PRIMARY KEY | Profile identifier (future FK to auth.users.id) |
| org_id | uuid | FK organizations(id) | Organization membership |
| email | text | - | User email address |
| full_name | text | - | User display name |
| role | text | CHECK IN ('curator','employee') | User role type |
| created_at | timestamptz | DEFAULT now() | Profile creation timestamp |

**C. Courses and Content**

`courses`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | uuid | PRIMARY KEY | Course identifier |
| org_id | uuid | FK organizations(id) | Owning organization |
| title | text | NOT NULL | Course title |
| size | text | CHECK IN ('S','M','L') | Course size category |
| quiz_count | integer | - | Number of quiz questions |
| open_count | integer | - | Number of open questions |
| created_by | uuid | - | Creator profile ID |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |

`course_items`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | uuid | PRIMARY KEY | Question identifier |
| course_id | uuid | FK courses(id) | Parent course |
| type | text | CHECK IN ('quiz','open') | Question type |
| prompt | text | NOT NULL | Question text |
| options | jsonb | NULLABLE | Quiz answer options (JSON array) |
| correct_option | integer | NULLABLE | Correct answer index (0-3) |
| order_index | integer | NOT NULL | Display order |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |

`enrollments`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | uuid | PRIMARY KEY | Enrollment identifier |
| course_id | uuid | FK courses(id) | Enrolled course |
| employee_id | uuid | - | Employee profile ID |
| status | text | CHECK IN ('invited','in_progress','completed') | Progress status |
| invited_at | timestamptz | DEFAULT now() | Invitation timestamp |
| started_at | timestamptz | NULLABLE | First attempt timestamp |
| completed_at | timestamptz | NULLABLE | Completion timestamp |

`answers`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | uuid | PRIMARY KEY | Answer identifier |
| enrollment_id | uuid | FK enrollments(id) | Related enrollment |
| course_item_id | uuid | FK course_items(id) | Answered question |
| answer_text | text | NULLABLE | Free text answer (for open questions) |
| answer_option | integer | NULLABLE | Selected option (for quiz) |
| is_correct | boolean | NULLABLE | Answer correctness |
| created_at | timestamptz | DEFAULT now() | Submission timestamp |

**D. Promo Codes and Usage Limits**

`promo_codes`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| code | text | PRIMARY KEY | Promo code string |
| max_courses | integer | - | Course creation limit |
| max_employees | integer | - | Employee enrollment limit |
| expires_at | timestamptz | NULLABLE | Expiration timestamp |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |

`org_usage`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| org_id | uuid | PRIMARY KEY | Organization identifier |
| courses_created | integer | DEFAULT 0 | Courses created counter |
| employees_connected | integer | DEFAULT 0 | Employees enrolled counter |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

**E. File Management**

`documents`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | uuid | PRIMARY KEY | Document identifier |
| org_id | uuid | FK organizations(id) | Owning organization |
| course_id | uuid | NULLABLE | Associated course (if any) |
| bucket | text | NOT NULL | Storage bucket name |
| path | text | NOT NULL | File path in bucket |
| original_name | text | NOT NULL | Original filename |
| mime_type | text | NOT NULL | File MIME type |
| size_bytes | bigint | NOT NULL | File size |
| created_by | uuid | - | Uploader profile ID |
| created_at | timestamptz | DEFAULT now() | Upload timestamp |

**Row Level Security (RLS) Strategy**

For Stage 1, RLS policies are not implemented. All database access occurs server-side using `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS. This simplifies initial development while maintaining security through server-only access patterns. Future stages will implement RLS policies when client-side database access is needed.

#### Storage Configuration

**Bucket Specification**

| Property | Value | Rationale |
|----------|-------|-----------|
| Name | `adapt-files` | Consistent naming convention |
| Visibility | Private | Files contain sensitive company knowledge |
| Allowed MIME Types | text/plain, application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, audio/webm, audio/mpeg | Supports TXT, PDF, DOCX, voice recordings |
| File Size Limit | 50 MB | Reasonable limit for knowledge base documents |

**Bucket Creation Strategy**

The bucket creation follows an idempotent approach:
- Check if bucket exists during health check
- Create bucket if missing with specified options
- Use Supabase Python client: `supabase.storage.create_bucket("adapt-files", options={...})`
- Implementation location: `GET /api/storage/health` endpoint or dedicated bootstrap script `scripts/bootstrap_storage.py`

**Test Upload Mechanism**

The test upload endpoint validates end-to-end storage functionality:
- Generate timestamped path: `healthcheck/<ISO-8601-timestamp>.txt`
- Upload small text content (e.g., "Health check at <timestamp>")
- Use Supabase Python client: `supabase.storage.from_("adapt-files").upload(...)`
- Return bucket name and file path on success

## Repository Structure

```
/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout component
│   ├── page.tsx                      # Home page
│   └── status/
│       └── page.tsx                  # Health check status dashboard
├── components/                       # React components
├── lib/
│   └── supabaseClient.ts            # Supabase anon client (future use)
├── styles/                           # Global styles
├── api/                              # Python FastAPI backend
│   ├── index.py                      # FastAPI app entrypoint
│   └── _lib/
│       ├── settings.py               # Environment variables configuration
│       └── supabase_admin.py         # Supabase service role client
├── supabase/
│   └── migrations/
│       └── 0001_init.sql             # Initial database schema
├── scripts/
│   ├── verify_local.sh               # Local health check script
│   ├── verify_prod.sh                # Production health check script
│   └── bootstrap_storage.py          # Storage bucket initialization (optional)
├── .github/
│   └── workflows/
│       └── ci.yml                    # Continuous integration pipeline
├── .env.example                      # Environment variables template
├── .env.local                        # Local environment (gitignored)
├── .gitignore                        # Git ignore patterns
├── .python-version                   # Python version specification (3.12)
├── README.md                         # Project documentation
├── requirements.txt                  # Python dependencies
├── pyproject.toml                    # Python project configuration (optional)
├── package.json                      # Node.js dependencies
├── next.config.js                    # Next.js configuration
└── vercel.json                       # Vercel configuration (minimal, if needed)
```

## Environment Variables Configuration

### Environment Variables Schema

**Public Variables (Browser-accessible)**

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL | https://xxxxx.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anonymous key | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... |

**Server-only Variables (Backend)**

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| SUPABASE_URL | Supabase project URL | https://xxxxx.supabase.co |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key (bypasses RLS) | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... |
| ENVIRONMENT | Runtime environment identifier | local / preview / production |
| GIT_SHA | Git commit hash (deployment tracking) | abc123def456... |

### Environment Configuration Files

**.env.example Template**

Contains all required variable keys with placeholder values (no secrets). This file is committed to the repository and serves as documentation for required configuration.

**.env.local (Gitignored)**

Contains actual secrets for local development. Developers copy `.env.example` to `.env.local` and fill in real values.

**Vercel Environment Variables**

Variables must be configured in Vercel dashboard for both Production and Preview environments:
- Navigate to Project Settings > Environment Variables
- Add each server-only variable separately
- Set appropriate environment scope (Production, Preview, Development)
- Public variables (NEXT_PUBLIC_*) are automatically exposed to browser

### Python Version Specification

Create `.python-version` file containing `3.12` to ensure consistent Python runtime on Vercel and in local development.

## Database Migration Strategy

### Migration File: `supabase/migrations/0001_init.sql`

This file contains SQL DDL statements to create all tables defined in the database schema section. The migration should be idempotent and include:
- Table creation with appropriate data types
- Primary key constraints
- Foreign key constraints with appropriate ON DELETE behaviors
- CHECK constraints for enum-like fields
- Default values for timestamps and other fields
- Index creation for foreign keys and frequently queried columns

### Migration Application Process

Migrations are applied using Supabase CLI following these steps:

1. **Link Local Project to Supabase**
   - Command: `supabase link --project-ref <project-id>`
   - Establishes connection between local repository and remote Supabase project

2. **Push Migrations to Remote Database**
   - Command: `supabase db push`
   - Applies all migrations in `supabase/migrations/` that haven't been applied yet
   - Supabase tracks applied migrations automatically

3. **Verify Migration Success**
   - Check Supabase dashboard to verify tables exist
   - Run health check endpoints to confirm database connectivity

### Migration Best Practices

- Migrations are never modified after being applied
- New changes require new migration files with incremented numbering
- Each migration should be atomic and reversible
- Test migrations locally before pushing to production
- Include descriptive comments in SQL files

## Vercel Deployment Configuration

### FastAPI on Vercel

Vercel natively supports Python serverless functions with FastAPI:
- Place FastAPI application in `api/index.py`
- Export FastAPI instance as `app = FastAPI()`
- Vercel automatically detects and deploys as ASGI application
- Each request spawns a serverless function execution

**Deployment Considerations**:
- Keep Python dependencies minimal to reduce cold start time
- Vercel bundles all reachable dependencies automatically
- Function timeout: 10 seconds (Hobby plan) / 60 seconds (Pro plan)
- Maximum deployment size: 250 MB (including dependencies)

### Local Development Workflow

Primary development command: `vercel dev`

This command:
- Starts Next.js development server
- Runs Python functions locally with Vercel runtime emulation
- Enables hot reloading for both frontend and backend
- Loads environment variables from `.env.local`
- Provides localhost URLs for testing

### GitHub Integration

**Setup Process**:
1. Create GitHub repository and push code
2. Connect repository to Vercel via Vercel dashboard
3. Configure environment variables in Vercel project settings
4. Enable automatic deployments

**Deployment Behavior**:
- Push to `main` branch triggers Production deployment
- Pull requests trigger Preview deployments
- Each deployment receives unique URL
- Deployment status reported back to GitHub PR

**Deployment Environments**:

| Environment | Trigger | URL Pattern | Purpose |
|-------------|---------|-------------|---------|
| Production | Push to main | project-name.vercel.app | Live production site |
| Preview | Pull request | project-name-git-branch.vercel.app | Testing before merge |
| Development | Local only | localhost:3000 | Local development |

## Continuous Integration Pipeline

### CI Workflow (`.github/workflows/ci.yml`)

The CI pipeline validates code quality and build integrity on every push and pull request.

**Node.js Validation Steps**:
1. Install dependencies: `npm ci`
2. Run linter: `npm run lint`
3. Type checking: `npm run typecheck` (or `tsc --noEmit`)
4. Build verification: `npm run build`

**Python Validation Steps**:
1. Install dependencies: `pip install -r requirements.txt`
2. Compile Python files: `python -m compileall api/`
3. Run tests (optional for Stage 1): `pytest` (structure prepared but tests not required yet)

**CI Success Criteria**:
- All commands exit with code 0
- No type errors in TypeScript code
- No syntax errors in Python code
- Next.js build completes successfully

## Health Check and Verification

### Local Verification Script: `scripts/verify_local.sh`

This shell script validates the local development environment by making HTTP requests to health check endpoints.

**Endpoints Checked**:
- `http://localhost:3000/api/health`
- `http://localhost:3000/api/supabase/health`
- `http://localhost:3000/api/storage/health`
- `http://localhost:3000/api/storage/test-upload` (POST)

**Success Criteria**:
- All endpoints return HTTP 200
- Response bodies contain expected JSON structure
- Database connectivity confirmed
- Storage bucket accessible
- Test file successfully uploaded

### Production Verification Script: `scripts/verify_prod.sh`

Similar to local verification but accepts deployment URL as parameter.

**Usage**: `./scripts/verify_prod.sh https://adapt-mvp.vercel.app`

**Behavior**:
- Replaces localhost with provided URL
- Executes same health checks as local script
- Reports success or failure for each endpoint
- Exits with non-zero code if any check fails

### Status Dashboard UI Requirements

The `/status` page provides visual health monitoring with the following requirements:

**Display Elements**:
- Page title: "System Status"
- Section for each health check endpoint
- Real-time status indicator (green checkmark / red X)
- Response time in milliseconds
- Error message display area (shown only on failure)
- Last checked timestamp
- Refresh button to re-run all checks

**Interaction Flow**:
1. Page loads and automatically triggers all health checks
2. Loading state shown while requests in progress
3. Results displayed as they arrive
4. User can manually refresh checks
5. Failed checks show detailed error information

## Definition of Done

Stage 1 is considered complete when all the following criteria are met:

### Local Development

| Criterion | Validation Method |
|-----------|-------------------|
| `vercel dev` runs successfully | Command starts without errors, both Next.js and Python functions accessible |
| `/status` page shows all checks green | Visual confirmation in browser at `localhost:3000/status` |
| Environment variables configured | `.env.local` exists with all required values |
| Database migrations applied | Tables visible in Supabase dashboard |
| Storage bucket exists | `adapt-files` bucket visible in Supabase Storage dashboard |
| Test file uploaded | `healthcheck/*.txt` file visible in bucket |

### Production Deployment

| Criterion | Validation Method |
|-----------|-------------------|
| Repository connected to Vercel | Vercel dashboard shows GitHub integration |
| Push to main triggers Production deploy | Commit to main results in deployment |
| Pull request triggers Preview deploy | Opening PR creates preview URL |
| Production health checks pass | `scripts/verify_prod.sh <prod-url>` exits with code 0 |
| Environment variables configured | All required variables set in Vercel project settings |

### Code Quality

| Criterion | Validation Method |
|-----------|-------------------|
| CI pipeline passes | GitHub Actions workflow completes successfully |
| No TypeScript errors | `tsc --noEmit` exits cleanly |
| No Python syntax errors | `python -m compileall` succeeds |
| Code follows commit plan | Git history matches specified commit structure |

## Implementation Commit Plan

Development should proceed through the following commits in order:

1. **`chore: init nextjs + tailwind + status page shell`**
   - Initialize Next.js project with App Router
   - Configure Tailwind CSS
   - Create basic `/status` page component (no functionality yet)
   - Set up `.gitignore` and `.env.example`

2. **`feat(api): add fastapi health endpoints`**
   - Create `api/index.py` with FastAPI app
   - Implement `GET /api/health` endpoint
   - Add `api/_lib/settings.py` for environment variable management
   - Create `requirements.txt` with minimal dependencies

3. **`feat(supabase): add admin client + db healthcheck`**
   - Create `api/_lib/supabase_admin.py` with service role client
   - Implement `GET /api/supabase/health` endpoint
   - Add database connection logic and error handling

4. **`feat(storage): add bucket bootstrap + test upload endpoint`**
   - Implement `GET /api/storage/health` with bucket creation
   - Implement `POST /api/storage/test-upload`
   - Add storage configuration and error handling

5. **`chore: add supabase migrations + docs for db push`**
   - Create `supabase/migrations/0001_init.sql`
   - Update README with migration instructions
   - Document Supabase CLI commands

6. **`chore: add vercel dev + verify scripts + ci`**
   - Create `scripts/verify_local.sh`
   - Create `scripts/verify_prod.sh`
   - Add `.github/workflows/ci.yml`
   - Update README with deployment and verification instructions
   - Add `.python-version` file

## Documentation Requirements

The README.md file must include the following sections:

### Project Overview
- Brief description of Adapt platform
- Stage 1 objectives and scope

### Prerequisites
- Node.js version requirement
- Python version requirement (3.12)
- Supabase CLI installation
- Vercel CLI installation

### Local Development Setup
1. Clone repository
2. Copy `.env.example` to `.env.local`
3. Fill in Supabase credentials
4. Install Node.js dependencies: `npm install`
5. Install Python dependencies: `pip install -r requirements.txt`
6. Link Supabase project: `supabase link --project-ref <project-id>`
7. Apply migrations: `supabase db push`
8. Run development server: `vercel dev`
9. Open `http://localhost:3000/status` to verify

### Vercel Deployment Setup
1. Push repository to GitHub
2. Import project in Vercel dashboard
3. Add environment variables (list all required variables)
4. Configure Production and Preview environments
5. Deploy

### Running Health Checks
- Local: `./scripts/verify_local.sh`
- Production: `./scripts/verify_prod.sh https://your-deployment.vercel.app`

### Project Structure
- Brief description of each major directory and its purpose

### Migration Management
- How to create new migrations
- How to apply migrations to remote database
- Migration naming convention
**Stage 1 Goal**: Build production-ready MVP skeleton with Vercel deployment and Supabase integration (Postgres + Storage). After any push, the application automatically deploys to Vercel (Preview + Production), and the production deployment passes e2e health checks: UI opens, API is live, Supabase is connected, Storage bucket is created, and test upload works.

## Core Requirements

### Mandatory Constraints

| Requirement | Description |
|-------------|-------------|
| Single Repository | Next.js frontend + Python FastAPI backend as Vercel serverless function |
| Environment Strategy | `.env.example` template, `.env.local` (gitignored), Vercel environment variables for Preview/Production |
| Auto-deployment | GitHub repository connected to Vercel triggers deployment on every push |
| Supabase Integration | SQL migrations in repository, private Storage bucket, API endpoints for DB/Storage verification, UI status page with health checks |
| Backend Architecture | Python functions in root `api/` folder (NOT Next.js `pages/api` or `app/api`) to avoid routing conflicts |
| Local Development | Use `vercel dev` to run both Next.js and Python functions simultaneously |
| Iterative Approach | Small commits, no breaking changes, incremental progress |

## System Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js (App Router) + Tailwind CSS | User interface, server-side rendering |
| Backend | Python FastAPI (Vercel Serverless) | API endpoints, business logic |
| Database | Supabase Postgres | Relational data storage |
| File Storage | Supabase Storage | Document and media file storage |
| Deployment | Vercel | Hosting, CI/CD, serverless functions |
| Version Control | GitHub | Source control, deployment trigger |

### Frontend Architecture

The frontend consists of Next.js pages using the App Router pattern with Tailwind for styling.

#### Status Page (`/status`)

The status page provides comprehensive health monitoring by calling backend endpoints and displaying results.

**Health Check Endpoints Called**:
- `GET /api/health` - Basic API availability check
- `GET /api/supabase/health` - Database connectivity verification
- `GET /api/storage/health` - Storage bucket availability check
- `POST /api/storage/test-upload` - Test file upload functionality

**Display Requirements**:
- Status indicator (OK/FAIL) for each check
- Response latency measurement
- Error messages when checks fail
- Visual styling with color coding (green for success, red for failure)

### Backend Architecture

FastAPI application deployed as Vercel serverless function (ASGI app).

#### API Endpoints Specification

| Endpoint | Method | Purpose | Response Schema |
|----------|--------|---------|-----------------|
| `/api/health` | GET | Basic health check | `{ ok: boolean, build: string, env: string }` |
| `/api/supabase/health` | GET | Database connectivity test | `{ ok: boolean, message: string, latency_ms: number }` |
| `/api/storage/health` | GET | Storage bucket verification | `{ ok: boolean, bucket: string, objects_count: number }` |
| `/api/storage/test-upload` | POST | Test file upload | `{ ok: boolean, bucket: string, path: string }` |

#### Endpoint Behavior Details

**`GET /api/health`**
- Returns application build information
- Includes environment identifier (local/preview/production)
- Uses GIT_SHA environment variable for build tracking
- Always returns HTTP 200 with JSON payload

**`GET /api/supabase/health`**
- Executes simple database query (e.g., `SELECT * FROM app_meta LIMIT 1`)
- Measures query execution time
- Returns connection status and latency
- Catches and reports database errors

**`GET /api/storage/health`**
- Checks if bucket `adapt-files` exists
- Creates bucket if missing (idempotent operation)
- Lists 1-5 objects to verify read access
- Returns bucket status and object count

**`POST /api/storage/test-upload`**
- Generates timestamped file path: `healthcheck/<iso_timestamp>.txt`
- Uploads small text content to bucket
- Verifies upload success
- Returns bucket name and file path

### Supabase Integration

#### Database Schema

The database schema supports organizations, users, courses, enrollments, and file management.

**A. System Tables**

`app_meta`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | integer | PRIMARY KEY, DEFAULT 1 | Single row identifier |
| created_at | timestamptz | DEFAULT now() | Initialization timestamp |
| schema_version | text | - | Migration version tracking |
| notes | text | NULLABLE | Administrative notes |

Purpose: Simple table for database health checks and schema versioning.

**B. Organizations and Profiles**

`organizations`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | uuid | PRIMARY KEY | Organization identifier |
| name | text | NOT NULL | Organization name |
| created_at | timestamptz | DEFAULT now() | Registration timestamp |

`profiles`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | uuid | PRIMARY KEY | Profile identifier (future FK to auth.users.id) |
| org_id | uuid | FK organizations(id) | Organization membership |
| email | text | - | User email address |
| full_name | text | - | User display name |
| role | text | CHECK IN ('curator','employee') | User role type |
| created_at | timestamptz | DEFAULT now() | Profile creation timestamp |

**C. Courses and Content**

`courses`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | uuid | PRIMARY KEY | Course identifier |
| org_id | uuid | FK organizations(id) | Owning organization |
| title | text | NOT NULL | Course title |
| size | text | CHECK IN ('S','M','L') | Course size category |
| quiz_count | integer | - | Number of quiz questions |
| open_count | integer | - | Number of open questions |
| created_by | uuid | - | Creator profile ID |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |

`course_items`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | uuid | PRIMARY KEY | Question identifier |
| course_id | uuid | FK courses(id) | Parent course |
| type | text | CHECK IN ('quiz','open') | Question type |
| prompt | text | NOT NULL | Question text |
| options | jsonb | NULLABLE | Quiz answer options (JSON array) |
| correct_option | integer | NULLABLE | Correct answer index (0-3) |
| order_index | integer | NOT NULL | Display order |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |

`enrollments`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | uuid | PRIMARY KEY | Enrollment identifier |
| course_id | uuid | FK courses(id) | Enrolled course |
| employee_id | uuid | - | Employee profile ID |
| status | text | CHECK IN ('invited','in_progress','completed') | Progress status |
| invited_at | timestamptz | DEFAULT now() | Invitation timestamp |
| started_at | timestamptz | NULLABLE | First attempt timestamp |
| completed_at | timestamptz | NULLABLE | Completion timestamp |

`answers`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | uuid | PRIMARY KEY | Answer identifier |
| enrollment_id | uuid | FK enrollments(id) | Related enrollment |
| course_item_id | uuid | FK course_items(id) | Answered question |
| answer_text | text | NULLABLE | Free text answer (for open questions) |
| answer_option | integer | NULLABLE | Selected option (for quiz) |
| is_correct | boolean | NULLABLE | Answer correctness |
| created_at | timestamptz | DEFAULT now() | Submission timestamp |

**D. Promo Codes and Usage Limits**

`promo_codes`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| code | text | PRIMARY KEY | Promo code string |
| max_courses | integer | - | Course creation limit |
| max_employees | integer | - | Employee enrollment limit |
| expires_at | timestamptz | NULLABLE | Expiration timestamp |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |

`org_usage`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| org_id | uuid | PRIMARY KEY | Organization identifier |
| courses_created | integer | DEFAULT 0 | Courses created counter |
| employees_connected | integer | DEFAULT 0 | Employees enrolled counter |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

**E. File Management**

`documents`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | uuid | PRIMARY KEY | Document identifier |
| org_id | uuid | FK organizations(id) | Owning organization |
| course_id | uuid | NULLABLE | Associated course (if any) |
| bucket | text | NOT NULL | Storage bucket name |
| path | text | NOT NULL | File path in bucket |
| original_name | text | NOT NULL | Original filename |
| mime_type | text | NOT NULL | File MIME type |
| size_bytes | bigint | NOT NULL | File size |
| created_by | uuid | - | Uploader profile ID |
| created_at | timestamptz | DEFAULT now() | Upload timestamp |

**Row Level Security (RLS) Strategy**

For Stage 1, RLS policies are not implemented. All database access occurs server-side using `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS. This simplifies initial development while maintaining security through server-only access patterns. Future stages will implement RLS policies when client-side database access is needed.

#### Storage Configuration

**Bucket Specification**

| Property | Value | Rationale |
|----------|-------|-----------|
| Name | `adapt-files` | Consistent naming convention |
| Visibility | Private | Files contain sensitive company knowledge |
| Allowed MIME Types | text/plain, application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, audio/webm, audio/mpeg | Supports TXT, PDF, DOCX, voice recordings |
| File Size Limit | 50 MB | Reasonable limit for knowledge base documents |

**Bucket Creation Strategy**

The bucket creation follows an idempotent approach:
- Check if bucket exists during health check
- Create bucket if missing with specified options
- Use Supabase Python client: `supabase.storage.create_bucket("adapt-files", options={...})`
- Implementation location: `GET /api/storage/health` endpoint or dedicated bootstrap script `scripts/bootstrap_storage.py`

**Test Upload Mechanism**

The test upload endpoint validates end-to-end storage functionality:
- Generate timestamped path: `healthcheck/<ISO-8601-timestamp>.txt`
- Upload small text content (e.g., "Health check at <timestamp>")
- Use Supabase Python client: `supabase.storage.from_("adapt-files").upload(...)`
- Return bucket name and file path on success

## Repository Structure

```
/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout component
│   ├── page.tsx                      # Home page
│   └── status/
│       └── page.tsx                  # Health check status dashboard
├── components/                       # React components
├── lib/
│   └── supabaseClient.ts            # Supabase anon client (future use)
├── styles/                           # Global styles
├── api/                              # Python FastAPI backend
│   ├── index.py                      # FastAPI app entrypoint
│   └── _lib/
│       ├── settings.py               # Environment variables configuration
│       └── supabase_admin.py         # Supabase service role client
├── supabase/
│   └── migrations/
│       └── 0001_init.sql             # Initial database schema
├── scripts/
│   ├── verify_local.sh               # Local health check script
│   ├── verify_prod.sh                # Production health check script
│   └── bootstrap_storage.py          # Storage bucket initialization (optional)
├── .github/
│   └── workflows/
│       └── ci.yml                    # Continuous integration pipeline
├── .env.example                      # Environment variables template
├── .env.local                        # Local environment (gitignored)
├── .gitignore                        # Git ignore patterns
├── .python-version                   # Python version specification (3.12)
├── README.md                         # Project documentation
├── requirements.txt                  # Python dependencies
├── pyproject.toml                    # Python project configuration (optional)
├── package.json                      # Node.js dependencies
├── next.config.js                    # Next.js configuration
└── vercel.json                       # Vercel configuration (minimal, if needed)
```

## Environment Variables Configuration

### Environment Variables Schema

**Public Variables (Browser-accessible)**

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL | https://xxxxx.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anonymous key | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... |

**Server-only Variables (Backend)**

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| SUPABASE_URL | Supabase project URL | https://xxxxx.supabase.co |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key (bypasses RLS) | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... |
| ENVIRONMENT | Runtime environment identifier | local / preview / production |
| GIT_SHA | Git commit hash (deployment tracking) | abc123def456... |

### Environment Configuration Files

**.env.example Template**

Contains all required variable keys with placeholder values (no secrets). This file is committed to the repository and serves as documentation for required configuration.

**.env.local (Gitignored)**

Contains actual secrets for local development. Developers copy `.env.example` to `.env.local` and fill in real values.

**Vercel Environment Variables**

Variables must be configured in Vercel dashboard for both Production and Preview environments:
- Navigate to Project Settings > Environment Variables
- Add each server-only variable separately
- Set appropriate environment scope (Production, Preview, Development)
- Public variables (NEXT_PUBLIC_*) are automatically exposed to browser

### Python Version Specification

Create `.python-version` file containing `3.12` to ensure consistent Python runtime on Vercel and in local development.

## Database Migration Strategy

### Migration File: `supabase/migrations/0001_init.sql`

This file contains SQL DDL statements to create all tables defined in the database schema section. The migration should be idempotent and include:
- Table creation with appropriate data types
- Primary key constraints
- Foreign key constraints with appropriate ON DELETE behaviors
- CHECK constraints for enum-like fields
- Default values for timestamps and other fields
- Index creation for foreign keys and frequently queried columns

### Migration Application Process

Migrations are applied using Supabase CLI following these steps:

1. **Link Local Project to Supabase**
   - Command: `supabase link --project-ref <project-id>`
   - Establishes connection between local repository and remote Supabase project

2. **Push Migrations to Remote Database**
   - Command: `supabase db push`
   - Applies all migrations in `supabase/migrations/` that haven't been applied yet
   - Supabase tracks applied migrations automatically

3. **Verify Migration Success**
   - Check Supabase dashboard to verify tables exist
   - Run health check endpoints to confirm database connectivity

### Migration Best Practices

- Migrations are never modified after being applied
- New changes require new migration files with incremented numbering
- Each migration should be atomic and reversible
- Test migrations locally before pushing to production
- Include descriptive comments in SQL files

## Vercel Deployment Configuration

### FastAPI on Vercel

Vercel natively supports Python serverless functions with FastAPI:
- Place FastAPI application in `api/index.py`
- Export FastAPI instance as `app = FastAPI()`
- Vercel automatically detects and deploys as ASGI application
- Each request spawns a serverless function execution

**Deployment Considerations**:
- Keep Python dependencies minimal to reduce cold start time
- Vercel bundles all reachable dependencies automatically
- Function timeout: 10 seconds (Hobby plan) / 60 seconds (Pro plan)
- Maximum deployment size: 250 MB (including dependencies)

### Local Development Workflow

Primary development command: `vercel dev`

This command:
- Starts Next.js development server
- Runs Python functions locally with Vercel runtime emulation
- Enables hot reloading for both frontend and backend
- Loads environment variables from `.env.local`
- Provides localhost URLs for testing

### GitHub Integration

**Setup Process**:
1. Create GitHub repository and push code
2. Connect repository to Vercel via Vercel dashboard
3. Configure environment variables in Vercel project settings
4. Enable automatic deployments

**Deployment Behavior**:
- Push to `main` branch triggers Production deployment
- Pull requests trigger Preview deployments
- Each deployment receives unique URL
- Deployment status reported back to GitHub PR

**Deployment Environments**:

| Environment | Trigger | URL Pattern | Purpose |
|-------------|---------|-------------|---------|
| Production | Push to main | project-name.vercel.app | Live production site |
| Preview | Pull request | project-name-git-branch.vercel.app | Testing before merge |
| Development | Local only | localhost:3000 | Local development |

## Continuous Integration Pipeline

### CI Workflow (`.github/workflows/ci.yml`)

The CI pipeline validates code quality and build integrity on every push and pull request.

**Node.js Validation Steps**:
1. Install dependencies: `npm ci`
2. Run linter: `npm run lint`
3. Type checking: `npm run typecheck` (or `tsc --noEmit`)
4. Build verification: `npm run build`

**Python Validation Steps**:
1. Install dependencies: `pip install -r requirements.txt`
2. Compile Python files: `python -m compileall api/`
3. Run tests (optional for Stage 1): `pytest` (structure prepared but tests not required yet)

**CI Success Criteria**:
- All commands exit with code 0
- No type errors in TypeScript code
- No syntax errors in Python code
- Next.js build completes successfully

## Health Check and Verification

### Local Verification Script: `scripts/verify_local.sh`

This shell script validates the local development environment by making HTTP requests to health check endpoints.

**Endpoints Checked**:
- `http://localhost:3000/api/health`
- `http://localhost:3000/api/supabase/health`
- `http://localhost:3000/api/storage/health`
- `http://localhost:3000/api/storage/test-upload` (POST)

**Success Criteria**:
- All endpoints return HTTP 200
- Response bodies contain expected JSON structure
- Database connectivity confirmed
- Storage bucket accessible
- Test file successfully uploaded

### Production Verification Script: `scripts/verify_prod.sh`

Similar to local verification but accepts deployment URL as parameter.

**Usage**: `./scripts/verify_prod.sh https://adapt-mvp.vercel.app`

**Behavior**:
- Replaces localhost with provided URL
- Executes same health checks as local script
- Reports success or failure for each endpoint
- Exits with non-zero code if any check fails

### Status Dashboard UI Requirements

The `/status` page provides visual health monitoring with the following requirements:

**Display Elements**:
- Page title: "System Status"
- Section for each health check endpoint
- Real-time status indicator (green checkmark / red X)
- Response time in milliseconds
- Error message display area (shown only on failure)
- Last checked timestamp
- Refresh button to re-run all checks

**Interaction Flow**:
1. Page loads and automatically triggers all health checks
2. Loading state shown while requests in progress
3. Results displayed as they arrive
4. User can manually refresh checks
5. Failed checks show detailed error information

## Definition of Done

Stage 1 is considered complete when all the following criteria are met:

### Local Development

| Criterion | Validation Method |
|-----------|-------------------|
| `vercel dev` runs successfully | Command starts without errors, both Next.js and Python functions accessible |
| `/status` page shows all checks green | Visual confirmation in browser at `localhost:3000/status` |
| Environment variables configured | `.env.local` exists with all required values |
| Database migrations applied | Tables visible in Supabase dashboard |
| Storage bucket exists | `adapt-files` bucket visible in Supabase Storage dashboard |
| Test file uploaded | `healthcheck/*.txt` file visible in bucket |

### Production Deployment

| Criterion | Validation Method |
|-----------|-------------------|
| Repository connected to Vercel | Vercel dashboard shows GitHub integration |
| Push to main triggers Production deploy | Commit to main results in deployment |
| Pull request triggers Preview deploy | Opening PR creates preview URL |
| Production health checks pass | `scripts/verify_prod.sh <prod-url>` exits with code 0 |
| Environment variables configured | All required variables set in Vercel project settings |

### Code Quality

| Criterion | Validation Method |
|-----------|-------------------|
| CI pipeline passes | GitHub Actions workflow completes successfully |
| No TypeScript errors | `tsc --noEmit` exits cleanly |
| No Python syntax errors | `python -m compileall` succeeds |
| Code follows commit plan | Git history matches specified commit structure |

## Implementation Commit Plan

Development should proceed through the following commits in order:

1. **`chore: init nextjs + tailwind + status page shell`**
   - Initialize Next.js project with App Router
   - Configure Tailwind CSS
   - Create basic `/status` page component (no functionality yet)
   - Set up `.gitignore` and `.env.example`

2. **`feat(api): add fastapi health endpoints`**
   - Create `api/index.py` with FastAPI app
   - Implement `GET /api/health` endpoint
   - Add `api/_lib/settings.py` for environment variable management
   - Create `requirements.txt` with minimal dependencies

3. **`feat(supabase): add admin client + db healthcheck`**
   - Create `api/_lib/supabase_admin.py` with service role client
   - Implement `GET /api/supabase/health` endpoint
   - Add database connection logic and error handling

4. **`feat(storage): add bucket bootstrap + test upload endpoint`**
   - Implement `GET /api/storage/health` with bucket creation
   - Implement `POST /api/storage/test-upload`
   - Add storage configuration and error handling

5. **`chore: add supabase migrations + docs for db push`**
   - Create `supabase/migrations/0001_init.sql`
   - Update README with migration instructions
   - Document Supabase CLI commands

6. **`chore: add vercel dev + verify scripts + ci`**
   - Create `scripts/verify_local.sh`
   - Create `scripts/verify_prod.sh`
   - Add `.github/workflows/ci.yml`
   - Update README with deployment and verification instructions
   - Add `.python-version` file

## Documentation Requirements

The README.md file must include the following sections:

### Project Overview
- Brief description of Adapt platform
- Stage 1 objectives and scope

### Prerequisites
- Node.js version requirement
- Python version requirement (3.12)
- Supabase CLI installation
- Vercel CLI installation

### Local Development Setup
1. Clone repository
2. Copy `.env.example` to `.env.local`
3. Fill in Supabase credentials
4. Install Node.js dependencies: `npm install`
5. Install Python dependencies: `pip install -r requirements.txt`
6. Link Supabase project: `supabase link --project-ref <project-id>`
7. Apply migrations: `supabase db push`
8. Run development server: `vercel dev`
9. Open `http://localhost:3000/status` to verify

### Vercel Deployment Setup
1. Push repository to GitHub
2. Import project in Vercel dashboard
3. Add environment variables (list all required variables)
4. Configure Production and Preview environments
5. Deploy

### Running Health Checks
- Local: `./scripts/verify_local.sh`
- Production: `./scripts/verify_prod.sh https://your-deployment.vercel.app`

### Project Structure
- Brief description of each major directory and its purpose

### Migration Management
- How to create new migrations
- How to apply migrations to remote database
- Migration naming convention
**Stage 1 Goal**: Build production-ready MVP skeleton with Vercel deployment and Supabase integration (Postgres + Storage). After any push, the application automatically deploys to Vercel (Preview + Production), and the production deployment passes e2e health checks: UI opens, API is live, Supabase is connected, Storage bucket is created, and test upload works.

## Core Requirements

### Mandatory Constraints

| Requirement | Description |
|-------------|-------------|
| Single Repository | Next.js frontend + Python FastAPI backend as Vercel serverless function |
| Environment Strategy | `.env.example` template, `.env.local` (gitignored), Vercel environment variables for Preview/Production |
| Auto-deployment | GitHub repository connected to Vercel triggers deployment on every push |
| Supabase Integration | SQL migrations in repository, private Storage bucket, API endpoints for DB/Storage verification, UI status page with health checks |
| Backend Architecture | Python functions in root `api/` folder (NOT Next.js `pages/api` or `app/api`) to avoid routing conflicts |
| Local Development | Use `vercel dev` to run both Next.js and Python functions simultaneously |
| Iterative Approach | Small commits, no breaking changes, incremental progress |

## System Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js (App Router) + Tailwind CSS | User interface, server-side rendering |
| Backend | Python FastAPI (Vercel Serverless) | API endpoints, business logic |
| Database | Supabase Postgres | Relational data storage |
| File Storage | Supabase Storage | Document and media file storage |
| Deployment | Vercel | Hosting, CI/CD, serverless functions |
| Version Control | GitHub | Source control, deployment trigger |

### Frontend Architecture

The frontend consists of Next.js pages using the App Router pattern with Tailwind for styling.

#### Status Page (`/status`)

The status page provides comprehensive health monitoring by calling backend endpoints and displaying results.

**Health Check Endpoints Called**:
- `GET /api/health` - Basic API availability check
- `GET /api/supabase/health` - Database connectivity verification
- `GET /api/storage/health` - Storage bucket availability check
- `POST /api/storage/test-upload` - Test file upload functionality

**Display Requirements**:
- Status indicator (OK/FAIL) for each check
- Response latency measurement
- Error messages when checks fail
- Visual styling with color coding (green for success, red for failure)

### Backend Architecture

FastAPI application deployed as Vercel serverless function (ASGI app).

#### API Endpoints Specification

| Endpoint | Method | Purpose | Response Schema |
|----------|--------|---------|-----------------|
| `/api/health` | GET | Basic health check | `{ ok: boolean, build: string, env: string }` |
| `/api/supabase/health` | GET | Database connectivity test | `{ ok: boolean, message: string, latency_ms: number }` |
| `/api/storage/health` | GET | Storage bucket verification | `{ ok: boolean, bucket: string, objects_count: number }` |
| `/api/storage/test-upload` | POST | Test file upload | `{ ok: boolean, bucket: string, path: string }` |

#### Endpoint Behavior Details

**`GET /api/health`**
- Returns application build information
- Includes environment identifier (local/preview/production)
- Uses GIT_SHA environment variable for build tracking
- Always returns HTTP 200 with JSON payload

**`GET /api/supabase/health`**
- Executes simple database query (e.g., `SELECT * FROM app_meta LIMIT 1`)
- Measures query execution time
- Returns connection status and latency
- Catches and reports database errors

**`GET /api/storage/health`**
- Checks if bucket `adapt-files` exists
- Creates bucket if missing (idempotent operation)
- Lists 1-5 objects to verify read access
- Returns bucket status and object count

**`POST /api/storage/test-upload`**
- Generates timestamped file path: `healthcheck/<iso_timestamp>.txt`
- Uploads small text content to bucket
- Verifies upload success
- Returns bucket name and file path

### Supabase Integration

#### Database Schema

The database schema supports organizations, users, courses, enrollments, and file management.

**A. System Tables**

`app_meta`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | integer | PRIMARY KEY, DEFAULT 1 | Single row identifier |
| created_at | timestamptz | DEFAULT now() | Initialization timestamp |
| schema_version | text | - | Migration version tracking |
| notes | text | NULLABLE | Administrative notes |

Purpose: Simple table for database health checks and schema versioning.

**B. Organizations and Profiles**

`organizations`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | uuid | PRIMARY KEY | Organization identifier |
| name | text | NOT NULL | Organization name |
| created_at | timestamptz | DEFAULT now() | Registration timestamp |

`profiles`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | uuid | PRIMARY KEY | Profile identifier (future FK to auth.users.id) |
| org_id | uuid | FK organizations(id) | Organization membership |
| email | text | - | User email address |
| full_name | text | - | User display name |
| role | text | CHECK IN ('curator','employee') | User role type |
| created_at | timestamptz | DEFAULT now() | Profile creation timestamp |

**C. Courses and Content**

`courses`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | uuid | PRIMARY KEY | Course identifier |
| org_id | uuid | FK organizations(id) | Owning organization |
| title | text | NOT NULL | Course title |
| size | text | CHECK IN ('S','M','L') | Course size category |
| quiz_count | integer | - | Number of quiz questions |
| open_count | integer | - | Number of open questions |
| created_by | uuid | - | Creator profile ID |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |

`course_items`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | uuid | PRIMARY KEY | Question identifier |
| course_id | uuid | FK courses(id) | Parent course |
| type | text | CHECK IN ('quiz','open') | Question type |
| prompt | text | NOT NULL | Question text |
| options | jsonb | NULLABLE | Quiz answer options (JSON array) |
| correct_option | integer | NULLABLE | Correct answer index (0-3) |
| order_index | integer | NOT NULL | Display order |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |

`enrollments`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | uuid | PRIMARY KEY | Enrollment identifier |
| course_id | uuid | FK courses(id) | Enrolled course |
| employee_id | uuid | - | Employee profile ID |
| status | text | CHECK IN ('invited','in_progress','completed') | Progress status |
| invited_at | timestamptz | DEFAULT now() | Invitation timestamp |
| started_at | timestamptz | NULLABLE | First attempt timestamp |
| completed_at | timestamptz | NULLABLE | Completion timestamp |

`answers`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | uuid | PRIMARY KEY | Answer identifier |
| enrollment_id | uuid | FK enrollments(id) | Related enrollment |
| course_item_id | uuid | FK course_items(id) | Answered question |
| answer_text | text | NULLABLE | Free text answer (for open questions) |
| answer_option | integer | NULLABLE | Selected option (for quiz) |
| is_correct | boolean | NULLABLE | Answer correctness |
| created_at | timestamptz | DEFAULT now() | Submission timestamp |

**D. Promo Codes and Usage Limits**

`promo_codes`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| code | text | PRIMARY KEY | Promo code string |
| max_courses | integer | - | Course creation limit |
| max_employees | integer | - | Employee enrollment limit |
| expires_at | timestamptz | NULLABLE | Expiration timestamp |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |

`org_usage`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| org_id | uuid | PRIMARY KEY | Organization identifier |
| courses_created | integer | DEFAULT 0 | Courses created counter |
| employees_connected | integer | DEFAULT 0 | Employees enrolled counter |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

**E. File Management**

`documents`
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | uuid | PRIMARY KEY | Document identifier |
| org_id | uuid | FK organizations(id) | Owning organization |
| course_id | uuid | NULLABLE | Associated course (if any) |
| bucket | text | NOT NULL | Storage bucket name |
| path | text | NOT NULL | File path in bucket |
| original_name | text | NOT NULL | Original filename |
| mime_type | text | NOT NULL | File MIME type |
| size_bytes | bigint | NOT NULL | File size |
| created_by | uuid | - | Uploader profile ID |
| created_at | timestamptz | DEFAULT now() | Upload timestamp |

**Row Level Security (RLS) Strategy**

For Stage 1, RLS policies are not implemented. All database access occurs server-side using `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS. This simplifies initial development while maintaining security through server-only access patterns. Future stages will implement RLS policies when client-side database access is needed.

#### Storage Configuration

**Bucket Specification**

| Property | Value | Rationale |
|----------|-------|-----------|
| Name | `adapt-files` | Consistent naming convention |
| Visibility | Private | Files contain sensitive company knowledge |
| Allowed MIME Types | text/plain, application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, audio/webm, audio/mpeg | Supports TXT, PDF, DOCX, voice recordings |
| File Size Limit | 50 MB | Reasonable limit for knowledge base documents |

**Bucket Creation Strategy**

The bucket creation follows an idempotent approach:
- Check if bucket exists during health check
- Create bucket if missing with specified options
- Use Supabase Python client: `supabase.storage.create_bucket("adapt-files", options={...})`
- Implementation location: `GET /api/storage/health` endpoint or dedicated bootstrap script `scripts/bootstrap_storage.py`

**Test Upload Mechanism**

The test upload endpoint validates end-to-end storage functionality:
- Generate timestamped path: `healthcheck/<ISO-8601-timestamp>.txt`
- Upload small text content (e.g., "Health check at <timestamp>")
- Use Supabase Python client: `supabase.storage.from_("adapt-files").upload(...)`
- Return bucket name and file path on success

## Repository Structure

```
/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout component
│   ├── page.tsx                      # Home page
│   └── status/
│       └── page.tsx                  # Health check status dashboard
├── components/                       # React components
├── lib/
│   └── supabaseClient.ts            # Supabase anon client (future use)
├── styles/                           # Global styles
├── api/                              # Python FastAPI backend
│   ├── index.py                      # FastAPI app entrypoint
│   └── _lib/
│       ├── settings.py               # Environment variables configuration
│       └── supabase_admin.py         # Supabase service role client
├── supabase/
│   └── migrations/
│       └── 0001_init.sql             # Initial database schema
├── scripts/
│   ├── verify_local.sh               # Local health check script
│   ├── verify_prod.sh                # Production health check script
│   └── bootstrap_storage.py          # Storage bucket initialization (optional)
├── .github/
│   └── workflows/
│       └── ci.yml                    # Continuous integration pipeline
├── .env.example                      # Environment variables template
├── .env.local                        # Local environment (gitignored)
├── .gitignore                        # Git ignore patterns
├── .python-version                   # Python version specification (3.12)
├── README.md                         # Project documentation
├── requirements.txt                  # Python dependencies
├── pyproject.toml                    # Python project configuration (optional)
├── package.json                      # Node.js dependencies
├── next.config.js                    # Next.js configuration
└── vercel.json                       # Vercel configuration (minimal, if needed)
```

## Environment Variables Configuration

### Environment Variables Schema

**Public Variables (Browser-accessible)**

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL | https://xxxxx.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anonymous key | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... |

**Server-only Variables (Backend)**

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| SUPABASE_URL | Supabase project URL | https://xxxxx.supabase.co |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key (bypasses RLS) | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... |
| ENVIRONMENT | Runtime environment identifier | local / preview / production |
| GIT_SHA | Git commit hash (deployment tracking) | abc123def456... |

### Environment Configuration Files

**.env.example Template**

Contains all required variable keys with placeholder values (no secrets). This file is committed to the repository and serves as documentation for required configuration.

**.env.local (Gitignored)**

Contains actual secrets for local development. Developers copy `.env.example` to `.env.local` and fill in real values.

**Vercel Environment Variables**

Variables must be configured in Vercel dashboard for both Production and Preview environments:
- Navigate to Project Settings > Environment Variables
- Add each server-only variable separately
- Set appropriate environment scope (Production, Preview, Development)
- Public variables (NEXT_PUBLIC_*) are automatically exposed to browser

### Python Version Specification

Create `.python-version` file containing `3.12` to ensure consistent Python runtime on Vercel and in local development.

## Database Migration Strategy

### Migration File: `supabase/migrations/0001_init.sql`

This file contains SQL DDL statements to create all tables defined in the database schema section. The migration should be idempotent and include:
- Table creation with appropriate data types
- Primary key constraints
- Foreign key constraints with appropriate ON DELETE behaviors
- CHECK constraints for enum-like fields
- Default values for timestamps and other fields
- Index creation for foreign keys and frequently queried columns

### Migration Application Process

Migrations are applied using Supabase CLI following these steps:

1. **Link Local Project to Supabase**
   - Command: `supabase link --project-ref <project-id>`
   - Establishes connection between local repository and remote Supabase project

2. **Push Migrations to Remote Database**
   - Command: `supabase db push`
   - Applies all migrations in `supabase/migrations/` that haven't been applied yet
   - Supabase tracks applied migrations automatically

3. **Verify Migration Success**
   - Check Supabase dashboard to verify tables exist
   - Run health check endpoints to confirm database connectivity

### Migration Best Practices

- Migrations are never modified after being applied
- New changes require new migration files with incremented numbering
- Each migration should be atomic and reversible
- Test migrations locally before pushing to production
- Include descriptive comments in SQL files

## Vercel Deployment Configuration

### FastAPI on Vercel

Vercel natively supports Python serverless functions with FastAPI:
- Place FastAPI application in `api/index.py`
- Export FastAPI instance as `app = FastAPI()`
- Vercel automatically detects and deploys as ASGI application
- Each request spawns a serverless function execution

**Deployment Considerations**:
- Keep Python dependencies minimal to reduce cold start time
- Vercel bundles all reachable dependencies automatically
- Function timeout: 10 seconds (Hobby plan) / 60 seconds (Pro plan)
- Maximum deployment size: 250 MB (including dependencies)

### Local Development Workflow

Primary development command: `vercel dev`

This command:
- Starts Next.js development server
- Runs Python functions locally with Vercel runtime emulation
- Enables hot reloading for both frontend and backend
- Loads environment variables from `.env.local`
- Provides localhost URLs for testing

### GitHub Integration

**Setup Process**:
1. Create GitHub repository and push code
2. Connect repository to Vercel via Vercel dashboard
3. Configure environment variables in Vercel project settings
4. Enable automatic deployments

**Deployment Behavior**:
- Push to `main` branch triggers Production deployment
- Pull requests trigger Preview deployments
- Each deployment receives unique URL
- Deployment status reported back to GitHub PR

**Deployment Environments**:

| Environment | Trigger | URL Pattern | Purpose |
|-------------|---------|-------------|---------|
| Production | Push to main | project-name.vercel.app | Live production site |
| Preview | Pull request | project-name-git-branch.vercel.app | Testing before merge |
| Development | Local only | localhost:3000 | Local development |

## Continuous Integration Pipeline

### CI Workflow (`.github/workflows/ci.yml`)

The CI pipeline validates code quality and build integrity on every push and pull request.

**Node.js Validation Steps**:
1. Install dependencies: `npm ci`
2. Run linter: `npm run lint`
3. Type checking: `npm run typecheck` (or `tsc --noEmit`)
4. Build verification: `npm run build`

**Python Validation Steps**:
1. Install dependencies: `pip install -r requirements.txt`
2. Compile Python files: `python -m compileall api/`
3. Run tests (optional for Stage 1): `pytest` (structure prepared but tests not required yet)

**CI Success Criteria**:
- All commands exit with code 0
- No type errors in TypeScript code
- No syntax errors in Python code
- Next.js build completes successfully

## Health Check and Verification

### Local Verification Script: `scripts/verify_local.sh`

This shell script validates the local development environment by making HTTP requests to health check endpoints.

**Endpoints Checked**:
- `http://localhost:3000/api/health`
- `http://localhost:3000/api/supabase/health`
- `http://localhost:3000/api/storage/health`
- `http://localhost:3000/api/storage/test-upload` (POST)

**Success Criteria**:
- All endpoints return HTTP 200
- Response bodies contain expected JSON structure
- Database connectivity confirmed
- Storage bucket accessible
- Test file successfully uploaded

### Production Verification Script: `scripts/verify_prod.sh`

Similar to local verification but accepts deployment URL as parameter.

**Usage**: `./scripts/verify_prod.sh https://adapt-mvp.vercel.app`

**Behavior**:
- Replaces localhost with provided URL
- Executes same health checks as local script
- Reports success or failure for each endpoint
- Exits with non-zero code if any check fails

### Status Dashboard UI Requirements

The `/status` page provides visual health monitoring with the following requirements:

**Display Elements**:
- Page title: "System Status"
- Section for each health check endpoint
- Real-time status indicator (green checkmark / red X)
- Response time in milliseconds
- Error message display area (shown only on failure)
- Last checked timestamp
- Refresh button to re-run all checks

**Interaction Flow**:
1. Page loads and automatically triggers all health checks
2. Loading state shown while requests in progress
3. Results displayed as they arrive
4. User can manually refresh checks
5. Failed checks show detailed error information

## Definition of Done

Stage 1 is considered complete when all the following criteria are met:

### Local Development

| Criterion | Validation Method |
|-----------|-------------------|
| `vercel dev` runs successfully | Command starts without errors, both Next.js and Python functions accessible |
| `/status` page shows all checks green | Visual confirmation in browser at `localhost:3000/status` |
| Environment variables configured | `.env.local` exists with all required values |
| Database migrations applied | Tables visible in Supabase dashboard |
| Storage bucket exists | `adapt-files` bucket visible in Supabase Storage dashboard |
| Test file uploaded | `healthcheck/*.txt` file visible in bucket |

### Production Deployment

| Criterion | Validation Method |
|-----------|-------------------|
| Repository connected to Vercel | Vercel dashboard shows GitHub integration |
| Push to main triggers Production deploy | Commit to main results in deployment |
| Pull request triggers Preview deploy | Opening PR creates preview URL |
| Production health checks pass | `scripts/verify_prod.sh <prod-url>` exits with code 0 |
| Environment variables configured | All required variables set in Vercel project settings |

### Code Quality

| Criterion | Validation Method |
|-----------|-------------------|
| CI pipeline passes | GitHub Actions workflow completes successfully |
| No TypeScript errors | `tsc --noEmit` exits cleanly |
| No Python syntax errors | `python -m compileall` succeeds |
| Code follows commit plan | Git history matches specified commit structure |

## Implementation Commit Plan

Development should proceed through the following commits in order:

1. **`chore: init nextjs + tailwind + status page shell`**
   - Initialize Next.js project with App Router
   - Configure Tailwind CSS
   - Create basic `/status` page component (no functionality yet)
   - Set up `.gitignore` and `.env.example`

2. **`feat(api): add fastapi health endpoints`**
   - Create `api/index.py` with FastAPI app
   - Implement `GET /api/health` endpoint
   - Add `api/_lib/settings.py` for environment variable management
   - Create `requirements.txt` with minimal dependencies

3. **`feat(supabase): add admin client + db healthcheck`**
   - Create `api/_lib/supabase_admin.py` with service role client
   - Implement `GET /api/supabase/health` endpoint
   - Add database connection logic and error handling

4. **`feat(storage): add bucket bootstrap + test upload endpoint`**
   - Implement `GET /api/storage/health` with bucket creation
   - Implement `POST /api/storage/test-upload`
   - Add storage configuration and error handling

5. **`chore: add supabase migrations + docs for db push`**
   - Create `supabase/migrations/0001_init.sql`
   - Update README with migration instructions
   - Document Supabase CLI commands

6. **`chore: add vercel dev + verify scripts + ci`**
   - Create `scripts/verify_local.sh`
   - Create `scripts/verify_prod.sh`
   - Add `.github/workflows/ci.yml`
   - Update README with deployment and verification instructions
   - Add `.python-version` file

## Documentation Requirements

The README.md file must include the following sections:

### Project Overview
- Brief description of Adapt platform
- Stage 1 objectives and scope

### Prerequisites
- Node.js version requirement
- Python version requirement (3.12)
- Supabase CLI installation
- Vercel CLI installation

### Local Development Setup
1. Clone repository
2. Copy `.env.example` to `.env.local`
3. Fill in Supabase credentials
4. Install Node.js dependencies: `npm install`
5. Install Python dependencies: `pip install -r requirements.txt`
6. Link Supabase project: `supabase link --project-ref <project-id>`
7. Apply migrations: `supabase db push`
8. Run development server: `vercel dev`
9. Open `http://localhost:3000/status` to verify

### Vercel Deployment Setup
1. Push repository to GitHub
2. Import project in Vercel dashboard
3. Add environment variables (list all required variables)
4. Configure Production and Preview environments
5. Deploy

### Running Health Checks
- Local: `./scripts/verify_local.sh`
- Production: `./scripts/verify_prod.sh https://your-deployment.vercel.app`

### Project Structure
- Brief description of each major directory and its purpose

### Migration Management
- How to create new migrations
- How to apply migrations to remote database
- Migration naming convention
