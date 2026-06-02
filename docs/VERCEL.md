# Deploy Nexus HRMS on Vercel

## 1. Vercel project settings

| Setting | Value |
|---------|--------|
| Framework | Next.js |
| Build Command | `prisma generate && next build` (default from `vercel.json`) |
| Install Command | `npm install` |
| Output Directory | (leave default) |
| Root Directory | `.` |

## 2. Environment variables

Add these in **Vercel → Project → Settings → Environment Variables**.

Enable for **Production** (and **Preview** if you want preview deployments to work fully).

### Required (core app + database)

| Variable | Example / notes |
|----------|------------------|
| `DATABASE_URL` | Neon **pooled** connection string (`?sslmode=require`) |
| `DIRECT_URL` | Neon **direct** connection string (same DB, non-pooler host) |
| `DEMO_MODE` | `false` or **omit** (required for real employee login) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` (your real Vercel URL) |
| `NEXT_PUBLIC_APP_NAME` | `Nexus HRMS` |

### Required (AI — OpenRouter)

| Variable | Example / notes |
|----------|------------------|
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` |
| `OPENROUTER_RESUME_API_KEY` | `sk-or-v1-...` (resume screening key) |
| `OPENROUTER_CHAT_API_KEY` | `sk-or-v1-...` (assistant + interview key) |
| `OPENROUTER_CHAT_MODEL` | `openai/gpt-4o-mini` |
| `OPENROUTER_RESUME_MODEL` | `openai/gpt-4o-mini` |
| `OPENROUTER_EMBEDDING_MODEL` | `openai/text-embedding-3-small` |

### Optional

| Variable | Notes |
|----------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin scripts |
| `NEXT_PUBLIC_DEMO_MODE` | `true` only for local demo UI on login page |

### Optional (legacy)

| Variable | Notes |
|----------|--------|
| `OPENAI_API_KEY` | Fallback if OpenRouter keys are not set |

---

## 3. Real employees (no demo mode)

**Do not set `DEMO_MODE=true` on Vercel.**

| System | Role |
|--------|------|
| **Neon** | Employee records, attendance, payroll, roles (`User` + `Employee` tables) |
| **Supabase** | Login passwords & sessions (email + password) |

**Onboarding flow:**

1. HR adds employee in HRMS (or seed) → row in Neon with work email.
2. Employee opens `/signup` → sets password (email must match Neon).
3. Employee signs in at `/login`.

In Supabase: **Authentication → Providers → Email** enabled.

**Required for signup/login without errors:**

1. **Authentication → Providers → Email** → turn **OFF** “Confirm email”
2. If a user already exists as unconfirmed: **Authentication → Users** → delete the old user → **Add user** with **Auto Confirm User** checked
3. Or run in Supabase **SQL Editor** (not Neon):

```sql
UPDATE auth.users
SET email_confirmed_at = now(), confirmed_at = now()
WHERE email = 'arjav@nexushrms.com';
```

## 4. Database setup (one time)

From your **local machine** (with Neon URLs in `.env`):

```bash
npx prisma db push
npm run db:seed
```

This creates tables and demo users in Neon. Vercel does not run seed automatically.

**Demo logins after seed:**

| Email | Password |
|-------|----------|
| arjav@nexushrms.com | Administrator — sign up at /signup |
| employee@nexushrms.com | sign up at /signup |

**Replace Alex Admin with Arjav Jain (existing Neon DB):**

```bash
npm run db:migrate-admin
# optional Supabase user id:
npm run db:migrate-admin -- ad9b4f6f-0edd-4039-ae45-10c06aaaad255
```

Then remove `admin@nexushrms.com` from Supabase → Authentication → Users if it still exists.

## 4. Deploy

1. Push latest code to GitHub.
2. Vercel redeploys (or click **Redeploy**).
3. Open your Vercel URL → `/login`.

## 5. Troubleshooting

| Issue | Fix |
|-------|-----|
| 500 on login / dashboard | Check `DATABASE_URL` and `DIRECT_URL` in Vercel |
| AI still in demo mode | Add OpenRouter keys; redeploy |
| OpenRouter 401/403 | Wrong key; check resume vs chat key per feature |
| Cookies / auth on Vercel | Set `NEXT_PUBLIC_APP_URL` to exact production URL (https, no trailing slash) |

## 6. Security

- Never commit `.env` or `.env.local` to GitHub.
- Rotate OpenRouter keys if they were shared in chat or logs.
- Use Vercel **encrypted** env vars for all secrets.
