# Nexus-HRMS — Complete Project Explanation

> **File 1 of 2** — Full end-to-end explanation (architecture, modules, data flow, deployment).  
> **Interview prep:** see [INTERVIEW_QA.md](./INTERVIEW_QA.md)

A complete walkthrough of **Nexus-HRMS**: what it is, how it is built, how data flows, and how each module works. Use this for presentations, viva, or onboarding.

---

## 1. What Is Nexus-HRMS?

**Nexus-HRMS** is a full-stack **Human Resource Management System** inspired by products like Keka. It helps companies manage:

- Employees and org structure  
- Attendance and leave  
- Payroll and payslips  
- Performance goals  
- Recruitment (with AI resume screening and voice interviews)  
- HR self-service (profile, notifications, approvals)

**Live demo (example):** `https://nexus-hrms-sandy.vercel.app`  
**Repo:** GitHub — `arjavjain310/NexusHRMS`

**Brand:** Logo + **Nexus-HRMS** title on login, sidebar, and payslips.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (React 19)                        │
│  Pages: login, dashboard, employees, attendance, leave, payroll…   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────────┐
│              Next.js 15 (App Router) — Vercel                       │
│  • Server Components (dashboard data)                             │
│  • Client Components (forms, charts, clock-in, AI chat)             │
│  • API Routes  /api/*  (REST JSON)                                │
│  • Middleware  (auth redirect, Supabase session)                  │
└────────────┬───────────────────────────────┬──────────────────────┘
             │                               │
    ┌────────▼────────┐            ┌─────────▼─────────┐
    │  Neon PostgreSQL │            │  Supabase Auth    │
    │  (Prisma ORM)    │            │  (production login)│
    │  Users, Employees│            │  Passwords, JWT    │
    │  Payslips, Leave │            └───────────────────┘
    └──────────────────┘
             │
    ┌────────▼────────┐
    │  OpenRouter API  │
    │  GPT + embeddings│
    │  Resume, chat,   │
    │  voice interview │
    └──────────────────┘
```

### Why this stack?

| Layer | Choice | Reason |
|--------|--------|--------|
| Frontend | Next.js 15 + React 19 | One codebase for UI + API; fast routing; SSR |
| UI | Tailwind + shadcn-style components | Consistent design, dark/light theme |
| Database | Neon (serverless Postgres) | Scales on Vercel; free tier for demos |
| ORM | Prisma | Type-safe schema, migrations, relations |
| Auth | Supabase (prod) / Demo cookie (dev) | Real passwords in production; easy local demo |
| AI | OpenRouter | One API for chat, resume parsing, interview analysis |
| Deploy | Vercel | Git push → auto deploy |

---

## 3. User Roles & Permissions (RBAC)

Four roles in `UserRole` enum:

| Role | Typical user | What they can do |
|------|----------------|------------------|
| **ADMIN** | Founder / HR head | Everything: employees, payroll, settings, grant “manage employees” to others |
| **SENIOR_MANAGER** | Team lead | Approvals (leave + attendance correction), team analytics, some modules |
| **HR_RECRUITER** | HR | Recruitment, resume AI, voice interview, employees (if granted) |
| **EMPLOYEE** | Staff | Own attendance, leave, payslips, profile, AI assistant |

**Permission logic** lives in `src/lib/auth/permissions.js` and `src/lib/auth/employee-management.js`:

- `manageEmployees` — only **ADMIN** by default; admin can grant `canManageEmployees` on any user (e.g. HR).  
- `approveLeave` — ADMIN + SENIOR_MANAGER → **Approvals** inbox.  
- `managePayroll` — ADMIN only for processing payroll.  
- Navigation items are filtered in `src/lib/constants.js` (`NAV_ITEMS` per role).

**Session** (`src/lib/auth/session.js`):

- **Demo mode:** cookie `nexus_demo_session` + optional Prisma user lookup.  
- **Production:** Supabase session + Prisma `User` row (email must exist in DB before signup/login).

**Default company password:** `nexus@310` for new employees until they use **Reset password** (`/reset-password`).

---

## 4. Request Flow (Example: Employee Clocks In)

1. Employee opens **Attendance** → `attendance-client.jsx` (client component).  
2. Clicks **Clock In** → `POST /api/attendance` with `{ action: "check-in" }`.  
3. API reads `getSession()` → gets `employeeId`.  
4. Prisma finds/creates today’s `Attendance` row (`checkIn` timestamp, status `PRESENT`).  
5. Response updates UI; optional **ActivityLog** / notifications for managers.  
6. Dashboard charts read aggregated attendance via `src/lib/data/dashboard.js`.

Same pattern for all modules: **UI → API route → Prisma → Neon → JSON response**.

---

## 5. Database Design (Prisma)

**Core entities:**

- **Organization** — multi-tenant root (demo: one org “Nexus Technologies”).  
- **User** — login account (email, role, `supabaseId`, `canManageEmployees`).  
- **Employee** — HR profile linked 1:1 to User (`userId`); code, dept, salary link.  
- **Department / Designation** — org structure.  
- **Attendance** — per employee per day (`checkIn`, `checkOut`).  
- **AttendanceCorrection** — employee requests fix; manager approves in `/approvals`.  
- **LeaveRequest** — type, dates, status, approver.  
- **SalaryStructure / Payslip** — payroll.  
- **Goal / PerformanceReview** — performance module.  
- **JobPost / Candidate / VoiceInterview** — recruitment + AI.  
- **Notification / ActivityLog** — bell icon + dashboard “Recent activity”.  
- **Holiday** — India 2026 calendar (public vs floater `isOptional`).  

**Important constraints:**

- `@@unique([organizationId, employeeCode])` — EMP001 for founder, FCFS numbering.  
- `@@unique([employeeId, month, year])` on Payslip.  
- Cascading deletes from Organization → Users/Employees.

**Scripts** (in `package.json`): seed, migrate admin, seed holidays, renumber employees, update team emails, etc.

---

## 6. Module-by-Module Explanation

### 6.1 Authentication

| Route | Purpose |
|-------|---------|
| `/login` | Email + password; “Reset password” link (no public signup on login) |
| `/reset-password` | Verify current password (default `nexus@310`), set new password via Supabase Admin API |
| `/signup` | Only if email already exists in Neon (HR pre-adds employee) |

**Files:** `api/auth/login`, `api/auth/reset-password`, `middleware.js`, `lib/auth/*`.

---

### 6.2 Dashboard

- Role-specific stats: Admin (org-wide), Manager (team), Recruiter (pipeline), Employee (self).  
- Charts: attendance area chart, performance bars (Recharts).  
- **Recent activity** feed from `ActivityLog` API.  
- Managers see link to **Approvals** inbox.

**Files:** `(dashboard)/dashboard/page.jsx`, `role-dashboards.jsx`, `lib/data/dashboard.js`.

---

### 6.3 Employees

- Directory with search.  
- **More options** menu: Add employee, Remove employee (terminate + delete auth), Manage employee access (admin grants HR add/remove rights).  
- Profile: banner, dept cards, tabs (About/Profile/Job/Documents).  
- Self-edit: Summary + Degrees (pen icon) on **My Profile**.

**API:** `GET/POST /api/employees`, `PATCH/DELETE /api/employees/[id]`, `GET /api/employees/meta`, `PATCH /api/employees/access`.

---

### 6.4 Attendance

- **Clock In / Clock Out** only (simplified from web/remote options).  
- Weekly strip, stats, logs.  
- **Attendance Requests** tab: correction form → `POST /api/attendance/corrections`.

---

### 6.5 Leave

- Balance cards (annual/sick/casual) from `lib/leave-balance.js`.  
- Apply leave with live remaining days.  
- Managers approve via **Approvals** or leave PATCH; notifications to employee.

---

### 6.6 Approvals (Managers / Admin)

- Single screen: pending **leave** + **attendance corrections**.  
- Approve/reject → updates DB + `Notification` + `ActivityLog`.

---

### 6.7 Payroll

- **My Salary** — structure view.  
- **Pay Slips** — **Year + Month** dropdowns → `GET /api/payroll?month=&year=` → generates payslip from `SalaryStructure` if missing.  
- **Payslip PDF:** `PayslipView` + `window.print()`; heading **Nexus-HRMS PaySlip**, employee name, generated date, **no company address**.  
- **Income Tax** — summary tab.

---

### 6.8 Performance

- Goals with progress; reviews; optional AI insights via OpenRouter.

---

### 6.9 Recruitment

- Job posts, candidate pipeline (status enum).  
- **Resume AI:** PDF upload → parse → embeddings / GPT match score → shortlist.  
- **Voice Interview:** AI-generated questions, browser speech, transcript analysis (sentiment, scores).

---

### 6.10 AI Assistant

- Chat UI → `POST /api/ai/chat` → HR policies, recruitment help (OpenRouter).

---

### 6.11 Holidays

- India **2026** calendar: **Public** (4 mandatory) vs **Floater leave** (optional).  
- **Upcoming** and **Past** sections.  
- Server-loaded from Neon (`lib/holidays-server.js`).

---

### 6.12 Notifications

- Bell in header → `GET/PATCH /api/notifications`.  
- Types: leave, payroll, interview, policy, attendance correction.

---

## 7. AI Features (Technical)

| Feature | API | AI logic |
|---------|-----|----------|
| Resume screening | `/api/ai/resume-screening` | `pdf-parse` + OpenRouter embeddings / GPT |
| HR chat | `/api/ai/chat` | `lib/ai/hr-assistant.js` |
| Voice interview | `/api/ai/voice-interview` | Questions + transcript analysis |
| Performance | `/api/performance` | Optional AI feedback |

**Env keys:** `OPENROUTER_RESUME_API_KEY`, `OPENROUTER_CHAT_API_KEY` (can split billing/limits).

Fallbacks exist when keys are missing (demo still runs).

---

## 8. Frontend Structure

```
src/app/
  page.jsx              → Landing
  login/                → Auth
  reset-password/
  (dashboard)/          → Protected layout (sidebar + header)
    dashboard/
    employees/
    attendance/
    leave/
    approvals/
    payroll/...
    recruitment/...
    me/profile/
    holidays/
  api/                  → Backend routes

src/components/
  layout/               → Sidebar, header, notifications
  dashboard/            → Charts, stat cards
  modules/              → Feature screens (client)
  employees/            → Forms, profile editors
  payroll/              → PayslipView
  ui/                   → Button, Card, Select, etc.
```

**Styling:** `globals.css` + Tailwind; CSS variables for theme; print styles for payslip `#payslip-print`.

---

## 9. Deployment Pipeline

1. **Code** on GitHub (`main`).  
2. **Vercel** builds: `prisma generate && next build`.  
3. **Env vars** on Vercel: `DATABASE_URL`, `DIRECT_URL`, Supabase keys, OpenRouter keys, `NEXT_PUBLIC_APP_URL`, `DEMO_MODE=false`.  
4. **Neon** holds production data; run `npx prisma db push` and seeds from local machine once.  
5. **Supabase** stores auth users; passwords updated via reset-password flow.

See `docs/VERCEL.md` for checklist.

---

## 10. Local Development Workflow

```bash
npm install
cp .env.example .env.local   # fill DATABASE_URL, keys
npx prisma db push
npm run db:seed
npm run dev                  # http://localhost:3000
```

Useful scripts:

- `npm run db:seed-holidays` — India 2026 holidays  
- `npm run db:renumber-employees` — Arjav = EMP001, others FCFS  
- `npm run db:update-team-auth` — team emails + Supabase passwords  

---

## 11. Security Considerations (Talking Points)

- **RBAC** on API routes (`getSession` + `hasPermission`).  
- Employees only see own payslip/attendance unless role allows.  
- **Supabase** handles password hashing; service role only on server for reset/add user.  
- **Middleware** redirects unauthenticated users from protected paths.  
- **No secrets** in client bundle (only `NEXT_PUBLIC_*` URLs/keys that are safe).  
- **SQL injection** mitigated by Prisma parameterized queries.

---

## 12. What You Can Say in 2 Minutes (Elevator Pitch)

> “Nexus-HRMS is a Next.js full-stack HR platform deployed on Vercel with Neon Postgres. It supports four roles—admin, manager, recruiter, and employee—with modules for attendance, leave, approvals, payroll with PDF payslips, and recruitment. We integrated OpenRouter for resume screening, an HR chatbot, and voice interview analysis. Auth uses Supabase in production with a default onboarding password and self-service reset. The architecture uses Prisma for data, API routes for business logic, and role-based navigation so each user sees only what they need.”

---

## 13. Possible Future Enhancements

- Email notifications (SendGrid/Resend) on leave approval  
- Proper PDF generation (e.g. `@react-pdf/renderer`) instead of print  
- Multi-organization SaaS signup  
- Mobile PWA for geo-fenced attendance  
- Audit logs for compliance  
- Unit/E2E tests (Playwright)

---

## 14. Key Files Cheat Sheet

| Topic | Path |
|-------|------|
| Schema | `prisma/schema.prisma` |
| Seed data | `prisma/seed.js` |
| Nav + roles | `src/lib/constants.js` |
| Permissions | `src/lib/auth/permissions.js` |
| Session | `src/lib/auth/session.js` |
| Middleware | `src/middleware.js` |
| Dashboard data | `src/lib/data/dashboard.js` |
| Payslip logic | `src/lib/payroll/payslip.js` |
| Holidays data | `src/lib/holidays-data.js` |

---

## 15. API Routes Reference

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/auth/login` | Sign in (Supabase or demo) |
| POST | `/api/auth/logout` | End session |
| POST | `/api/auth/signup` | Link Supabase user to existing Prisma user |
| POST | `/api/auth/reset-password` | Change password (verify current, set new) |
| GET/POST | `/api/employees` | List / create employees |
| GET/PATCH/DELETE | `/api/employees/[id]` | Profile, update, terminate |
| GET | `/api/employees/meta` | Departments, designations, managers for forms |
| PATCH | `/api/employees/access` | Grant/revoke `canManageEmployees` |
| GET/POST | `/api/attendance` | Today’s record, check-in/out |
| GET/POST | `/api/attendance/corrections` | Correction requests |
| GET/POST | `/api/leave` | Leave requests |
| GET | `/api/leave/balance` | Remaining leave by type |
| GET/PATCH | `/api/approvals` | Manager inbox (leave + corrections) |
| GET | `/api/payroll` | Payslip by `?month=&year=` (auto-generate if needed) |
| GET | `/api/holidays` | Holiday calendar JSON |
| GET/PATCH | `/api/notifications` | Bell dropdown |
| GET | `/api/activity` | Dashboard recent activity |
| GET/PATCH | `/api/me` | Current user profile updates |
| GET/POST | `/api/recruitment` | Jobs and candidates |
| GET/POST | `/api/performance` | Reviews |
| GET/POST | `/api/performance/goals` | Goals CRUD |
| POST | `/api/ai/chat` | HR assistant |
| POST | `/api/ai/resume-screening` | Resume vs job match |
| POST | `/api/ai/voice-interview` | Interview Q&A and scoring |

Every protected route: `getSession()` → permission check → Prisma → JSON.

---

## 16. Demo Accounts (After Seed)

| Role | Example email | Notes |
|------|---------------|--------|
| Admin | `arjav@nexushrms.com` | Full access, EMP001 |
| Manager | `ravi@nexushrms.com` | Approvals |
| HR | `saakshi@nexushrms.com` | Recruitment |
| Employee | `harshit@nexushrms.com` | Self-service |

Default password for new users: **`nexus@310`** → change via `/reset-password`.

---

*Document version: aligned with Nexus-HRMS codebase as of project completion.*
