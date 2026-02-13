# Deployment Guide

## Prerequisites

- **Node.js 20.x** (LTS) — pinned via `.nvmrc` and `package.json#engines`
- **Python 3.12** — for the FastAPI backend (`api/index.py`)
- A Vercel project connected to this repository

## Environment Variables

Set these in your Vercel project settings (Settings → Environment Variables):

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL (e.g. `https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key — **server-only, never exposed to client** |
| `YANDEX_API_KEY` | ✅ | Yandex AI Studio API key |
| `YANDEX_FOLDER_ID` | ✅ | Yandex Cloud folder ID |
| `YANDEX_PROMPT_ID` | optional | Yandex AI prompt template ID |
| `YANDEX_MODEL_URI` | optional | Yandex AI model URI override |

> The app **throws a readable error at runtime** if `NEXT_PUBLIC_SUPABASE_URL` or
> `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing — no silent failures.

## Node Version

This project requires **Node 20** (LTS). Vercel picks this up automatically from `package.json`:

```json
"engines": { "node": "20.x" }
```

If you use nvm locally:

```bash
nvm use   # reads .nvmrc → 20
```

## Architecture

- **Next.js 15** (App Router) — all frontend routes under `app/`
- **FastAPI** (Python) — serverless function at `api/index.py`, handles every `/api/*` request
  - Runtime declared in `vercel.json` → `@vercel/python@4.3.1`
  - Python dependencies: `requirements.txt`
- **Supabase** — auth + file storage (bucket `courses`). No SQL DB — courses stored as `manifest.json` in Storage.

## Deploy to Vercel

```bash
# 1. Install dependencies
npm ci

# 2. Verify the Next.js build is clean
npm run build

# 3. (Optional) run a local Vercel build to catch Python builder issues early
vercel build --debug

# 4. Push to your branch — Vercel deploys automatically on push
git push origin main
```

## Test Plan (after deploy)

1. `npm run build` — must exit 0, no TypeScript errors
2. `vercel build --debug` — Python builder installs successfully, no 250 MB limit breach
3. Open `/curator/courses` in the preview URL — KPI cards and course table render
4. Open `/curator/analytics` — analytics page renders without runtime errors
5. Click "Создать курс" — wizard opens and proceeds through all 3 steps
6. Open `/` (landing) — no 500 errors

## Common Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| `@vercel/python` install fails | Node 24 selected — breaks builder native deps | Ensure `"engines": { "node": "20.x" }` is in `package.json` and Node 20 is set in Vercel project settings |
| Python function > 250 MB | `.next/cache/` bundled into Python function | `vercel.json` → `excludeFiles` already excludes `.next/**` — verify it's present |
| `Missing env var: NEXT_PUBLIC_SUPABASE_URL` | Env vars not set in Vercel | Add all required vars in Vercel dashboard |
| `storage3` fails to import | Wrong version installed | Pin `storage3==0.8.2` — newer pulls in `pyiceberg` (~100 MB) |
