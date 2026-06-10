# Nexus HRMS (Human Resource Management System)

A full-stack HR platform that centralizes employee lifecycle management—hiring, attendance, leave, payroll, and performance—in a single web application with role-based access and real-time dashboards.

---

## Project Overview

Organizations often manage HR tasks across spreadsheets, email, and disconnected tools. Nexus HRMS solves this by providing one system where administrators and staff can manage employees, track attendance, process leave and payroll, run recruitment pipelines, and record performance reviews.

The platform reduces manual coordination, enforces consistent policies, and gives each role a focused view of the data they need.

---

## Key Features

| Module | Description |
|--------|-------------|
| **Authentication & Role-Based Access** | Secure login with permissions scoped by role (Admin, Senior Manager, HR Recruiter, Employee). |
| **Employee Management** | Directory, profiles, departments, designations, add/edit/remove employees, and delegated admin access. |
| **Attendance Management** | Check-in/check-out, daily status tracking, and attendance analytics. |
| **Leave Management** | Leave requests, gender-based eligibility rules, and admin-controlled approvals. |
| **Payroll Management** | Salary structures, payslip generation, tax summary, and INR-based payroll views. |
| **Recruitment Management** | Job posts, candidate pipeline, resume screening, and voice interview workflows. |
| **Performance Review System** | Goal tracking, 0–5 ratings (one decimal), reviewer permissions, and read-only employee review history. |
| **Dashboard & Analytics** | Role-specific KPIs, attendance charts, and recruitment/performance summaries. |
| **Notifications & Approvals** | In-app notifications and centralized leave approval for administrators. |

---

## Tech Stack

| Layer | Technologies |
|-------|----------------|
| **Frontend** | Next.js 15 (App Router), React 19, JavaScript (JSX), Tailwind CSS, shadcn/ui, Recharts |
| **Backend** | Next.js API Routes, server-side session handling |
| **Database** | Neon PostgreSQL (serverless) |
| **Authentication** | Demo session (local) + Supabase Auth (production-ready) |
| **ORM** | Prisma |
| **AI (optional)** | OpenRouter (resume screening, HR assistant, interview insights) |
| **Deployment** | Vercel |

---

## System Architecture

```
Browser (React UI)
       │
       ▼
Next.js App Router ──► API Routes (/api/*)
       │                      │
       │                      ▼
       │               Prisma ORM
       │                      │
       ▼                      ▼
Server Components      Neon PostgreSQL
       │
       ▼
Middleware (route protection) + Session (Supabase / demo cookie)
```

1. **Frontend** — Dashboard pages and module UIs fetch data from REST API routes.
2. **Backend** — API routes enforce authentication, validate input, and apply business rules.
3. **Database** — Prisma models store employees, attendance, leave, payroll, recruitment, and reviews.
4. **Authentication** — Middleware guards protected routes; each request resolves the user session and role before data access.

---

## User Roles

| Role | Permissions (summary) |
|------|------------------------|
| **Admin** | Full system access: employee CRUD, leave approvals, payroll processing, recruitment, performance review submission, and granting delegated permissions. |
| **HR Recruiter** | Employee directory access, recruitment pipeline, resume AI, leave management views, and own attendance/leave/payroll profile. |
| **Senior Manager** | Team-oriented dashboards, employee directory, leave management, performance review submission, and personal HR self-service. |
| **Employee** | Self-service: profile, attendance, leave requests, payslips, goals, and read-only performance reviews. |

Admins may grant **employee-management** or **performance-review** access to specific users without changing their base role.

---

## Workflow

```
Login → Dashboard → Employee Management → Attendance → Leave → Payroll → Performance Reviews
```

| Step | Action |
|------|--------|
| **Login** | User authenticates; session stores role and organization context. |
| **Dashboard** | Role-specific metrics (headcount, attendance, recruitment, payroll). |
| **Employee Management** | Admin/authorized users onboard staff, assign departments, and set salary. |
| **Attendance** | Employees check in/out; managers monitor presence. |
| **Leave** | Employees submit requests; admins approve or reject. |
| **Payroll** | Salary structures drive payslip views and monthly payroll totals. |
| **Performance Reviews** | Managers submit ratings; employees view feedback read-only. |

---

## Security Features

- **Role-based authorization** — API routes and navigation items check role and explicit grants before allowing actions.
- **Protected routes** — Middleware redirects unauthenticated users away from dashboard modules.
- **Secure authentication** — Supabase-backed auth in production; HTTP-only demo sessions for local development.
- **Data validation** — Server-side validation on employee records, leave rules, ratings (0–5, one decimal), and salary fields.

---

## Project Highlights

- **Scalable design** — Multi-tenant `organizationId` scoping, indexed Prisma queries, and paginated API responses.
- **Maintainable codebase** — Modular `src/app`, `src/components`, and `src/lib` structure with shared auth and permission helpers.
- **Production-oriented** — Deployable on Vercel with Neon; environment-driven configuration.
- **Real-world HR use case** — Covers end-to-end workflows found in SMB and enterprise HR teams (not a static CRUD demo).

---

## Future Enhancements

- Native **mobile application** for attendance and leave on the go
- **AI-powered analytics** for attrition risk, hiring funnel, and workforce planning
- **Email/SMS integrations** for leave approvals, payroll alerts, and interview scheduling
- **Advanced reporting** with exportable HR compliance and payroll reports

---

## Quick Start

```bash
npm install
cp .env.example .env.local
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Minimum environment variables:**

```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
DEMO_MODE=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Quick Demo Accounts:** enable `ENABLE_DEMO_LOGIN=true` and `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true`, then use **Admin / Manager / HR / Employee** on `/login` (no password).

**Demo accounts** (password: `demo-local-only` when `DEMO_MODE=true`):

| Role | Email |
|------|-------|
| Admin | arjav@nexushrms.com |
| Senior Manager | saakshi@nexushrms.com |
| HR Recruiter | harshit@nexushrms.com |
| Employee | employee@nexushrms.com |
| Demo Admin | demo-admin@nexushrms.com |
| Demo Manager | demo-manager@nexushrms.com |
| Demo HR | demo-hr@nexushrms.com |
| Demo Employee | demo-employee@nexushrms.com |

**Deploy:** Push to GitHub, import on Vercel, set env vars from `.env.example`, then run `npx prisma db push` and `npm run db:seed` against your Neon database once.
