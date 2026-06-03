# Nexus-HRMS — Interview Questions & Answers

> **File 2 of 2** — 75+ interview questions with answers.  
> **Full project explanation:** see [PROJECT_GUIDE.md](./PROJECT_GUIDE.md)

Use this document to prepare for technical interviews, viva, or HR rounds about your project. Answers are written in first person (“I”) — adjust as needed.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Tech Stack](#2-architecture--tech-stack)
3. [Frontend (Next.js / React)](#3-frontend-nextjs--react)
4. [Backend & API Design](#4-backend--api-design)
5. [Database & Prisma](#5-database--prisma)
6. [Authentication & Security](#6-authentication--security)
7. [Core HR Modules](#7-core-hr-modules)
8. [AI Features](#8-ai-features)
9. [Deployment & DevOps](#9-deployment--devops)
10. [Challenges & Problem-Solving](#10-challenges--problem-solving)
11. [Behavioral / SDE HR Questions](#11-behavioral--sde-hr-questions)
12. [Quick Rapid-Fire](#12-quick-rapid-fire)
13. [System Design & Coding (Extra)](#13-system-design--coding-extra)

---

## 1. Project Overview

### Q1. What is Nexus-HRMS?

**A:** Nexus-HRMS is a full-stack Human Resource Management System I built using Next.js 15, React, Prisma, and Neon PostgreSQL. It covers employee management, attendance, leave, payroll with payslip download, performance, recruitment, and AI features like resume screening and a voice interview module. It is deployed on Vercel with Supabase for authentication in production.

---

### Q2. Why did you build this project?

**A:** I wanted a portfolio-grade application that mirrors real HR products like Keka—combining CRUD workflows, role-based access, approvals, and modern AI integrations. It demonstrates end-to-end skills: database design, REST APIs, auth, UI/UX, and cloud deployment.

---

### Q3. Who are the users of your system?

**A:** Four roles: **Admin** (full control), **Senior Manager** (approvals and team view), **HR Recruiter** (hiring and AI tools), and **Employee** (self-service for attendance, leave, payslips, and profile).

---

### Q4. What is unique about your project compared to a basic CRUD app?

**A:** Role-based dashboards, approval workflows with notifications, payroll generation from salary structures, India-specific holiday calendar (public vs floater), delegated employee-management permissions, and three AI modules (resume matching, HR chatbot, voice interview analysis)—not just simple create/read/update/delete.

---

## 2. Architecture & Tech Stack

### Q5. Explain your system architecture.

**A:** It is a **three-tier architecture**: (1) React client in the browser, (2) Next.js server handling pages and `/api/*` routes on Vercel, (3) Neon PostgreSQL via Prisma. Supabase handles authentication separately. OpenRouter is called from API routes for AI. There is no separate Express server—Next.js is the backend.

---

### Q6. Why Next.js App Router instead of Pages Router?

**A:** App Router is the current standard in Next.js 15. It supports React Server Components for faster initial loads, nested layouts (`(dashboard)/layout.jsx` for sidebar), and colocated `app/api` routes. It fits a dashboard-heavy HR app well.

---

### Q7. Why Neon instead of MongoDB or MySQL?

**A:** HR data is relational—employees belong to departments, have managers, leave links to approvers, payslips link to employees. PostgreSQL with Prisma gives foreign keys, transactions, and strong consistency. Neon is serverless Postgres, which pairs well with Vercel’s serverless functions.

---

### Q8. What is Prisma and why use it?

**A:** Prisma is an ORM that maps TypeScript/JavaScript to SQL. I define models in `schema.prisma`, run `db push` to sync Neon, and use `prisma.employee.findMany()` in API routes. It prevents raw SQL mistakes and documents the data model in one place.

---

### Q9. Why Supabase for auth if you already have a User table?

**A:** I store **business data** (role, organization, employee link) in Neon. Supabase Auth handles **password hashing, sessions, and JWT** securely. On login, Supabase validates the password; then I load the matching `User` row from Prisma. This avoids building auth from scratch.

---

### Q10. What is demo mode vs production mode?

**A:** With `DEMO_MODE=true`, login can use a cookie session and default password without Supabase—useful for local demos. In production (`DEMO_MODE=false`), real Supabase login is required, and employees must exist in Neon before they can sign up or reset password.

---

## 3. Frontend (Next.js / React)

### Q11. Server Components vs Client Components—how did you use them?

**A:** Server Components for pages that fetch data once (e.g. holidays page loads from DB on server). Client Components (`"use client"`) for interactivity: attendance clock-in, leave forms, payslip month/year dropdowns, AI chat, and notifications bell. Rule: use client only where state/effects are needed.

---

### Q12. How do you handle dark/light theme?

**A:** `next-themes` with a `ThemeProvider` and toggle in the header. Tailwind uses CSS variables (`--background`, `--primary`) in `globals.css` so components adapt automatically.

---

### Q13. How does role-based navigation work in the UI?

**A:** `NAV_ITEMS` in `constants.js` each have an optional `roles` array. The sidebar filters items where the user’s role is included. Unauthorized routes are also blocked in middleware.

---

### Q14. How do you download payslip as PDF?

**A:** The payslip is rendered in a printable `div` with id `payslip-print`. **Download PDF** triggers `window.print()`, and CSS `@media print` hides the rest of the page. The user saves as PDF from the browser print dialog. No server-side PDF library yet.

---

### Q15. What UI library did you use?

**A:** Tailwind CSS for styling plus shadcn/ui-**style** components I own in `src/components/ui` (Button, Card, Select, Badge, etc.)—not a heavy external UI kit, so I control the code.

---

## 4. Backend & API Design

### Q16. How are APIs structured?

**A:** REST-style JSON under `src/app/api/`. Examples: `GET/POST /api/employees`, `POST /api/attendance` with `{ action: "check-in" }`, `GET /api/payroll?month=4&year=2026`. Each route calls `getSession()`, checks permissions, uses Prisma, returns `NextResponse.json()`.

---

### Q17. How do you handle errors in APIs?

**A:** Try/catch around Prisma calls, return appropriate HTTP status (400 validation, 401 unauthorized, 403 forbidden, 404 not found, 500 server error) with a JSON `{ error: "message" }`. The client shows errors in the UI.

---

### Q18. Why not GraphQL?

**A:** For this scope, REST was simpler—each HR module maps to clear endpoints. GraphQL adds complexity for a solo/small project. REST is also easier for interviewers and deployment on Vercel serverless.

---

### Q19. How does the approval inbox API work?

**A:** `GET /api/approvals` returns pending leave requests and attendance corrections for the org. `PATCH` with `{ kind: "leave" | "attendance", id, status }` updates the record, creates a notification for the employee, and logs activity for the dashboard feed.

---

### Q20. How is payslip generated when none exists?

**A:** `GET /api/payroll?month=&year=` looks up the payslip. If missing, it reads `SalaryStructure`, computes earnings/deductions/net pay in `buildPayslipFromStructure()`, upserts a `Payslip` row, and returns it—so the employee always gets a slip if salary is configured.

---

## 5. Database & Prisma

### Q21. Explain your main database tables.

**A:** **Organization** (tenant) → **User** (login) → **Employee** (profile). Supporting: Department, Designation, Attendance, LeaveRequest, Payslip, SalaryStructure, Goal, JobPost, Candidate, Notification, ActivityLog, Holiday, AttendanceCorrection. Relations enforce integrity (e.g. employee must belong to org).

---

### Q22. What is the relationship between User and Employee?

**A:** One-to-one optional link: `Employee.userId` → `User.id`. Every employee who can log in has a User row with email and role. HR can add an employee which creates both records.

---

### Q23. How do you prevent duplicate payslips?

**A:** Prisma `@@unique([employeeId, month, year])` on the Payslip model. Upsert uses that composite key.

---

### Q24. What are migrations vs `db push`?

**A:** I used `prisma db push` for rapid prototyping—it syncs schema to Neon without migration files. For production teams, `prisma migrate dev` creates versioned SQL migrations. Both work; migrate is better for team audit trails.

---

### Q25. How did you seed the database?

**A:** `prisma/seed.js` creates organization, departments, demo users (Arjav admin, managers, employees), salary structures, sample payslips, holidays, notifications, and activity logs. Additional scripts seed holidays 2026, renumber employee codes, etc.

---

### Q26. What is `canManageEmployees` on User?

**A:** A boolean flag only **Admin** can set. When true, that user (e.g. HR recruiter) can add/remove employees via the More options menu, even if their role is not ADMIN. Admin always has access.

---

## 6. Authentication & Security

### Q27. Walk through the login flow.

**A:** User submits email/password on `/login` → `POST /api/auth/login` → Supabase `signInWithPassword` (or demo cookie) → load Prisma user by email → if missing, reject (“not in company database”) → session established → redirect to `/dashboard`.

---

### Q28. Why must HR add employee before signup?

**A:** So only company emails exist in Neon. Signup links Supabase auth to an existing `User` row. This prevents random public registration—a common enterprise HR requirement.

---

### Q29. How does reset password work?

**A:** User enters email, **current** password (default `nexus@310` for new staff), new password, and confirmation → API verifies user in Prisma → Supabase sign-in with current password → `admin.updateUserById` with new password → user logs in with new password.

---

### Q30. How do you protect API routes?

**A:** Every sensitive route starts with `const session = await getSession()`; if null, return 401. Then check role via `hasPermission()` or `canManageEmployees()`. Employees can only access their own `employeeId` for payslip/attendance unless manager/admin.

---

### Q31. What does middleware do?

**A:** `src/middleware.js` runs on matched paths: allows public routes (`/`, `/login`, `/reset-password`), uses Supabase session refresh in production, redirects unauthenticated users away from `/dashboard`, `/employees`, etc., to `/login`.

---

### Q32. Where are passwords stored?

**A:** Hashed in **Supabase Auth**, not in our Postgres tables. We only store `supabaseId` on User for linking.

---

## 7. Core HR Modules

### Q33. How does attendance clock-in/out work?

**A:** One record per employee per day. Clock-in sets `checkIn` timestamp; clock-out sets `checkOut`. API rejects double clock-in without clock-out. Status stored as PRESENT. UI shows live clock and weekly strip.

---

### Q34. What is attendance correction?

**A:** If someone forgot to clock in/out, they submit date + reason. Manager sees it in **Approvals**, approves or rejects. On approve, we can update attendance notes; employee gets a notification.

---

### Q35. How is leave balance calculated?

**A:** `lib/leave-balance.js` defines entitlements per leave type (e.g. annual 12, sick 6). Approved leaves in the current year are subtracted. The leave form shows live remaining balance via `/api/leave/balance`.

---

### Q36. Explain the leave approval workflow.

**A:** Employee `POST /api/leave` → status PENDING → managers get notification → `/approvals` PATCH approve/reject → employee notified → activity log updated → balance recalculated on next fetch.

---

### Q37. Difference between public holiday and floater leave?

**A:** In our holiday calendar, **public** holidays (New Year, Republic Day, Independence Day, Gandhi Jayanti) are mandatory off for all. **Floater** holidays (Holi, Diwali, etc.) are optional—employees may apply them as floater leave per company policy. Stored as `isOptional` on Holiday model.

---

### Q38. How does add employee work?

**A:** Admin/authorized HR fills form → `POST /api/employees` creates `User` + `Employee` in a transaction, optional salary structure, syncs Supabase user with default password `nexus@310`, returns success message with login instructions.

---

### Q39. How does remove employee work?

**A:** `DELETE /api/employees/[id]`—cannot remove self or last admin. Deletes Supabase user if linked, sets employee TERMINATED and clears userId. Payroll history retained.

---

### Q40. What appears on the employee profile?

**A:** Banner with name, designation, contact, employee code; cards for business unit, department, sub-department; optional reporting manager; tabs for bio/education (editable by self), tax/profile fields, job info, documents.

---

## 8. AI Features

### Q41. How does resume screening work?

**A:** User uploads PDF → server parses text with `pdf-parse` → skills/experience extracted → OpenRouter/GPT compares to job description → returns match score and summary → candidate can be shortlisted in recruitment pipeline.

---

### Q42. What is the HR AI assistant?

**A:** Chat interface sends messages to `POST /api/ai/chat`. Backend uses OpenRouter with a system prompt for HR policies, leave rules, recruitment guidance. Messages stored in `ChatMessage` table per user session.

---

### Q43. Explain the voice interview module.

**A:** Recruiter selects job/candidate → AI generates interview questions via OpenRouter → candidate answers using browser speech (Web Speech API) → transcript sent for analysis → scores for sentiment, communication, confidence stored on `VoiceInterview` model.

---

### Q44. Why OpenRouter instead of OpenAI directly?

**A:** OpenRouter provides one API key access to multiple models (e.g. GPT-4o-mini) and I split resume vs chat keys for cost control. Implementation uses the OpenAI-compatible SDK pointed at OpenRouter base URL.

---

### Q45. What if AI API fails?

**A:** Routes catch errors and return friendly messages. Some modules have fallback mock scores for demo. Core HR (attendance, leave) does not depend on AI.

---

## 9. Deployment & DevOps

### Q46. How did you deploy the project?

**A:** GitHub repo connected to Vercel. On push, Vercel runs `prisma generate && next build`. Environment variables set in Vercel dashboard. Neon database is external—connection string in `DATABASE_URL`. Live URL example: `nexus-hrms-sandy.vercel.app`.

---

### Q47. What environment variables are required in production?

**A:** `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `DEMO_MODE=false`, optional OpenRouter keys, `DEFAULT_COMPANY_PASSWORD=nexus@310`.

---

### Q48. Why did attendance or payroll break on Vercel initially?

**A:** Common issues: missing env vars, Prisma client not generated at build, null `checkOut` JSON serialization, or `employeeId` missing from session. I fixed with null-safe serializers, session hydration from DB, and proper schema push to Neon.

---

### Q49. How do you run database updates after deploy?

**A:** Schema changes: run `npx prisma db push` locally against production `DATABASE_URL` (carefully) or use migrations. Data scripts: `npm run db:seed-holidays`, etc. Code deploy does not auto-migrate DB.

---

### Q50. Git workflow you used?

**A:** Feature development on `main` or branches, push to GitHub `arjavjain310/NexusHRMS`, Vercel auto-deploys. No force push to main. Commits when features complete (notifications, approvals, payslip, etc.).

---

## 10. Challenges & Problem-Solving

### Q51. What was the hardest bug you fixed?

**A:** Attendance clock-out UI showed loading forever because `actionLoading` used string prefix matching incorrectly, and API returned null `checkOut` that broke client state. Fixed API serialization and client loading state logic.

---

### Q52. Prisma EPERM on Windows—what did you do?

**A:** OneDrive or antivirus locks `query_engine` DLL during `prisma generate`. Fix: close dev server, retry generate, or run build on Vercel where CI has clean filesystem.

---

### Q53. Dropdown overlapping on Add Employee form?

**A:** Radix Select inside modal needed `side="left"` for left-column fields and higher z-index on `SelectContent` portal so menus don’t cover other inputs.

---

### Q54. Payslip not showing for 2024?

**A:** Seed data was for 2026; UI defaulted to wrong year. Fixed default year to 2026 and added month/year API that auto-generates from salary structure.

---

### Q55. How did you migrate from Alex Admin to Arjav Jain?

**A:** Script `migrate-admin-to-arjav.mjs` updates user/employee records, reassigns manager references, removes old admin, sets founder profile (AIML Engineer, Development, EMP001, no manager).

---

## 11. Behavioral / SDE HR Questions

### Q56. How long did this project take?

**A:** (Adjust to your truth.) Built iteratively over several weeks: core HR modules first, then AI, notifications, approvals, payroll polish, and deployment fixes.

---

### Q57. Did you work alone or in a team?

**A:** I developed it as an individual project—from design to deployment—with feedback from testing different roles via demo accounts.

---

### Q58. What would you improve given more time?

**A:** Email notifications, real PDF library, unit/integration tests, mobile app, geolocation attendance, multi-org SaaS onboarding, and audit trail for compliance.

---

### Q59. How does this project help you as a developer?

**A:** It proves I can design a database, build secure APIs, create polished UI, integrate third-party services (Supabase, OpenRouter, Neon), and ship to production on Vercel—full SDLC, not just tutorials.

---

### Q60. How do you explain this to a non-technical interviewer?

**A:** “It is like an internal company website where employees mark attendance and apply for leave, managers approve requests, HR manages hiring with AI resume screening, and everyone can download salary slips—everything secured with login and different access levels.”

---

## 12. Quick Rapid-Fire

| Question | Short answer |
|----------|----------------|
| Language? | JavaScript (JSX), not TypeScript |
| Database? | PostgreSQL (Neon) |
| ORM? | Prisma |
| Auth? | Supabase + Prisma User |
| Deploy? | Vercel |
| AI? | OpenRouter (GPT) |
| Default password? | `nexus@310` |
| Founder employee code? | EMP001 |
| Public holidays count? | 4 (NY, Republic, Independence, Gandhi Jayanti) |
| Clock-in options? | Clock In + Clock Out only |
| Payslip heading? | Nexus-HRMS PaySlip |
| Signup on login page? | Removed; use Reset password |
| Activity feed? | ActivityLog model |
| Notifications? | Bell + Notification model |

---

## 13. System Design & Coding (Extra)

### Q61. How would you scale this to 10,000 employees?

**A:** Keep Neon with connection pooling (PgBouncer), add read replicas for reports, paginate employee lists, cache dashboard aggregates in Redis, move heavy AI jobs to a queue (e.g. BullMQ), and split orgs with strict `organizationId` on every query.

---

### Q62. Why Server Components for some pages?

**A:** Holidays and parts of dashboard fetch data on the server—no extra client bundle, faster first paint, and secrets stay on server. Interactive parts stay as client components.

---

### Q63. How do you serialize Prisma dates for JSON?

**A:** `Date` objects are converted to ISO strings in API responses or helper serializers so React clients never receive non-JSON types. Fixed bugs where `null` checkOut broke UI state.

---

### Q64. What is middleware matcher doing?

**A:** It runs on dashboard and API paths (not static assets). Refreshes Supabase session cookies, redirects guests from `/employees`, `/payroll`, etc. to `/login`, and allows public routes like `/login` and `/reset-password`.

---

### Q65. Difference between `db push` and `migrate`?

**A:** `db push` syncs schema quickly for solo dev. `migrate` creates SQL migration history—better for teams and production rollbacks. I used push during rapid iteration; production teams should prefer migrate.

---

### Q66. How does delegated employee management work?

**A:** Admin sets `User.canManageEmployees = true` via `/api/employees/access`. `canManageEmployees(session)` in API allows POST/DELETE on employees without being ADMIN role.

---

### Q67. Write the pseudo-code for leave approval.

**A:**  
`session = getSession()` → `require approveLeave` → `find LeaveRequest where id and org` → `update status APPROVED` → `create Notification for employee` → `create ActivityLog` → `return 200`.

---

### Q68. What libraries parse PDF resumes?

**A:** `pdf-parse` on the server extracts text from uploaded PDF; then GPT/OpenRouter compares skills and experience to the job description.

---

### Q69. Is this multi-tenant?

**A:** Schema supports **Organization** as tenant root—all queries filter by `organizationId`. Current seed uses one org; SaaS would add org signup and subdomain routing.

---

### Q70. What testing did you add?

**A:** Primarily manual testing per role and production smoke tests after Vercel deploy. Automated Playwright/Jest is listed as a future improvement in the project guide.

---

### Q71. How does activity log differ from notifications?

**A:** **Notifications** are user-specific alerts (bell, read/unread). **ActivityLog** is an org-wide feed for dashboards (“Ravi approved leave for Harshit”)—broader audit-style timeline.

---

### Q72. Why remove signup from login page?

**A:** Enterprise HR apps onboard users internally. Public signup would let anyone register; we require HR to create the employee first, then reset password.

---

### Q73. Explain EMP001 and employee codes.

**A:** `@@unique([organizationId, employeeCode])`. Script `renumber-employees` sets founder to EMP001; others numbered first-come-first-served for display and payslips.

---

### Q74. What happens on DELETE employee?

**A:** Cannot delete self or last admin. Supabase user removed if present; employee marked TERMINATED; `userId` cleared; historical payslips/attendance kept.

---

### Q75. Name three trade-offs you made.

**A:** (1) Print-to-PDF instead of server PDF—faster to ship, less dependency. (2) JavaScript not TypeScript—faster prototyping, less compile friction. (3) `db push` over formal migrations—speed in solo dev vs team audit trail.

---

## Bonus: Questions YOU Can Ask the Interviewer

1. How does your company handle HRMS integrations (payroll providers, biometric devices)?  
2. Do you use serverless or long-running servers for internal tools?  
3. What is your approach to RBAC and audit logs in production systems?

---

*Good luck with your interview. Read [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) for the full end-to-end narrative.*
