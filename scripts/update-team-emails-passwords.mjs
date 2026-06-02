/**
 * Update Ravi / Saakshi / Harshit emails and set Supabase password to company default.
 *   npm run db:update-team-auth
 *
 * Requires DATABASE_URL and (for login passwords) SUPABASE_SERVICE_ROLE_KEY.
 */
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = process.env.DEFAULT_COMPANY_PASSWORD || "nexus@310";

const EMAIL_CHANGES = [
  { from: "admin@nexushrms.com", to: "ravi@nexushrms.com", name: "Ravi Kumar" },
  { from: "manager@nexushrms.com", to: "saakshi@nexushrms.com", name: "Saakshi Sinha" },
  { from: "recruiter@nexushrms.com", to: "harshit@nexushrms.com", name: "Harshit Raj" },
];

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function syncSupabase(admin, email, supabaseId) {
  const normalized = email.toLowerCase();

  if (supabaseId) {
    const { error } = await admin.auth.admin.updateUserById(supabaseId, {
      email: normalized,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
    });
    if (!error) return { ok: true, id: supabaseId };
    console.warn("  Supabase update by id failed:", error.message);
  }

  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list?.users?.find((u) => u.email?.toLowerCase() === normalized);

  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password: DEFAULT_PASSWORD,
      email_confirm: true,
    });
    if (error) console.warn("  Supabase password update:", error.message);
    return { ok: !error, id: existing.id };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: normalized,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
  });
  if (error) {
    console.warn("  Supabase create:", error.message);
    return { ok: false };
  }
  return { ok: true, id: data.user?.id };
}

async function main() {
  const admin = getAdmin();
  if (!admin) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY not set — Neon emails only; set password in Supabase manually.");
  }

  for (const change of EMAIL_CHANGES) {
    let user = await prisma.user.findFirst({
      where: { email: { equals: change.from, mode: "insensitive" } },
      include: { employee: true },
    });
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          employee: {
            firstName: change.name.split(" ")[0],
            lastName: change.name.split(" ")[1],
          },
        },
        include: { employee: true },
      });
    }
    if (!user) {
      console.warn("Skip — no user for", change.from, "/", change.name);
      continue;
    }

    const conflict = await prisma.user.findUnique({ where: { email: change.to } });
    if (conflict && conflict.id !== user.id) {
      console.error("Email already taken:", change.to);
      continue;
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { email: change.to },
      });
      if (user.employee) {
        await tx.employee.update({
          where: { id: user.employee.id },
          data: { email: change.to },
        });
      }
    });

    let supabaseId = user.supabaseId;
    if (admin) {
      const result = await syncSupabase(admin, change.to, supabaseId);
      if (result.id && result.id !== supabaseId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { supabaseId: result.id },
        });
      }
      console.log(
        `✓ ${change.name} → ${change.to} (Supabase ${result.ok ? "password set" : "see warnings"})`
      );
    } else {
      console.log(`✓ ${change.name} → ${change.to} (Neon only)`);
    }
  }

  console.log(`\nDefault company password: ${DEFAULT_PASSWORD}`);
  console.log("Users should change it after first login via Supabase / profile when you add that flow.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
