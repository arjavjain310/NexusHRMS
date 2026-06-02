# Nexus HRMS

A modern, AI-powered Human Resource Management System built with Next.js 15, JavaScript (JSX), Tailwind CSS, shadcn/ui, **Neon PostgreSQL**, Prisma, and OpenAI.

> *A modern AI-first version of KEKA built for next-generation HR teams.*

## Features

| Module | Capabilities |
|--------|-------------|
| **Authentication** | Role-based access (Admin, Senior Manager, HR Recruiter, Employee), demo & Supabase auth |
| **Employees** | Directory, profiles, departments, designations, search |
| **Attendance** | Check-in/check-out, daily tracking, analytics |
| **Leave** | Requests, approval workflow, leave types |
| **Payroll** | Salary structures, payslips, automated calculation |
| **Performance** | Goals, KPIs, reviews, AI insights |
| **Recruitment** | Job posts, candidate pipeline |
| **Resume AI** | PDF parsing, skill detection, semantic matching, auto-shortlisting |
| **AI Assistant** | HR chatbot for policies, recruitment, scheduling |
| **Voice Interview** | AI questions, Web Speech API, sentiment & scoring |
| **Dashboards** | Role-specific views for each user type |

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, JavaScript (JSX), Tailwind CSS
- **UI:** shadcn/ui-style components, Recharts, next-themes (dark/light)
- **Backend:** Next.js API Routes, Server Actions ready
- **Database:** [Neon](https://neon.tech) PostgreSQL + Prisma ORM
- **Auth:** Demo mode (optional Supabase Auth)
- **AI:** [OpenRouter](https://openrouter.ai) (GPT-4o-mini & embeddings; separate keys for resume vs chat/interview)
- **Deploy:** Vercel + Neon

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Neon account ([console.neon.tech](https://console.neon.tech))
- OpenRouter API keys (optional — demo fallbacks included)

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

**Demo mode (no database required):**

```env
DEMO_MODE=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Full setup with Neon:**

```env
DATABASE_URL=postgresql://USER:PASSWORD@ep-xxx.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://USER:PASSWORD@ep-xxx.aws.neon.tech/neondb?sslmode=require
OPENROUTER_RESUME_API_KEY=sk-or-v1-...
OPENROUTER_CHAT_API_KEY=sk-or-v1-...
DEMO_MODE=true
```

Copy the connection string from **Neon Console → Connect** (use the same URL for `DATABASE_URL` and `DIRECT_URL`).

### 3. Database setup

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@nexushrms.com | (set via /signup with Supabase) |
| Senior Manager | manager@nexushrms.com | (set via /signup) |
| HR Recruiter | recruiter@nexushrms.com | (set via /signup) |
| Employee | employee@nexushrms.com | (set via /signup) |

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Protected app routes
│   │   ├── dashboard/
│   │   ├── employees/
│   │   ├── attendance/
│   │   ├── leave/
│   │   ├── payroll/
│   │   ├── performance/
│   │   ├── recruitment/
│   │   ├── ai-assistant/
│   │   ├── holidays/
│   │   └── settings/
│   ├── api/                  # REST API routes
│   ├── login/
│   └── page.jsx              # Landing page
├── components/
│   ├── dashboard/
│   ├── layout/
│   ├── modules/
│   └── ui/
├── lib/
│   ├── ai/                   # OpenAI integrations
│   ├── auth/
│   ├── data/
│   └── supabase/
prisma/
├── schema.prisma
└── seed.js
```

## Neon Database Setup

1. Create a project at [console.neon.tech](https://console.neon.tech)
2. Copy the **connection string** from the dashboard (Connect → `.env` format)
3. Add to `.env.local`:
   - `DATABASE_URL` — your Neon connection string (`?sslmode=require`)
   - `DIRECT_URL` — same URL (or use the **pooled** host for `DATABASE_URL` in production)
4. Push the schema and seed demo data:

```bash
npx prisma db push
npm run db:seed
```

5. Restart the dev server so Prisma picks up the new env vars

## OpenRouter Setup

1. Create keys at [openrouter.ai/keys](https://openrouter.ai/keys) (e.g. one for resume, one for chat/interview)
2. Add to `.env.local`:
   - `OPENROUTER_RESUME_API_KEY` — resume screening & embeddings
   - `OPENROUTER_CHAT_API_KEY` — HR assistant, voice interview, performance insights
3. Restart the dev server (`npm run dev`)

## Vercel Deployment

1. Push code to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Add all environment variables — see **[docs/VERCEL.md](docs/VERCEL.md)** for the full list
4. Run `npx prisma db push` and `npm run db:seed` once against your Neon database (from your PC)
5. Deploy / Redeploy

**Important:** Set `NEXT_PUBLIC_APP_URL` to your live Vercel URL (e.g. `https://nexus-hrms.vercel.app`).

## API Routes

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/auth/login` | POST | Sign in |
| `/api/auth/logout` | POST | Sign out |
| `/api/employees` | GET, POST | Employee CRUD |
| `/api/attendance` | GET, POST | Attendance records & check-in |
| `/api/leave` | GET, POST, PATCH | Leave requests & approvals |
| `/api/payroll` | GET, POST | Payslips & processing |
| `/api/performance` | GET, POST | Goals & reviews |
| `/api/recruitment` | GET | Jobs & candidates |
| `/api/ai/chat` | POST | HR assistant |
| `/api/ai/resume-screening` | POST | Resume upload & AI scoring |
| `/api/ai/voice-interview` | POST | Questions & analysis |

## Scalability Notes

- Neon serverless Postgres with Prisma; use pooled connection in production if needed
- Indexed queries on `organizationId`, `employeeId`, `status`
- API routes paginated (`take: 50-100`)
- Server Components for dashboard data
- Designed for 5,000+ users with proper DB tier

## License

MIT — Built for demonstration and production extension.
