# Nexus HRMS

AI-powered HRMS built with Next.js, Prisma, Neon PostgreSQL, and OpenRouter.

## Quick start

```bash
npm install
cp .env.example .env.local
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment (minimum)

```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
DEMO_MODE=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Optional: `OPENROUTER_RESUME_API_KEY`, `OPENROUTER_CHAT_API_KEY` for AI features.

### Demo login

| Role | Email | Password |
|------|-------|----------|
| Admin | arjav@nexushrms.com | `demo-local-only` |
| Senior Manager | saakshi@nexushrms.com | `demo-local-only` |
| HR Recruiter | harshit@nexushrms.com | `demo-local-only` |
| Employee | employee@nexushrms.com | `demo-local-only` |

## Deploy

Push to GitHub → import on Vercel → add env vars from `.env.example` → run `npx prisma db push` and `npm run db:seed` against Neon once.

See [docs/VERCEL.md](docs/VERCEL.md) for production env details.

## More docs

- [docs/PROJECT_GUIDE.md](docs/PROJECT_GUIDE.md) — architecture and modules
