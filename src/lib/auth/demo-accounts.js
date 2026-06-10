import { SANDBOX_ORG_SLUG } from "@/lib/sandbox/constants";
import { ensureSandboxReady } from "@/lib/sandbox/seed";
import { resetSandboxOrganization } from "@/lib/sandbox/reset";
import {
  DEMO_ACCOUNT_KEYS,
  DEMO_ACCOUNTS,
  isValidDemoAccountKey,
  getDemoAccountByKey,
  isDemoAccountEmail,
} from "@/lib/auth/demo-account-config";

export {
  DEMO_ACCOUNT_KEYS,
  DEMO_ACCOUNTS,
  isValidDemoAccountKey,
  getDemoAccountByKey,
  isDemoAccountEmail,
};

/** Demo login accounts that must survive sandbox reset (re-created by seed). */
export const PRESERVED_DEMO_ACCOUNT_EMAILS = Object.values(DEMO_ACCOUNTS).map((a) =>
  a.email.toLowerCase()
);

export function isDemoAccountUser(user) {
  return Boolean(user?.isDemoAccount) || isDemoAccountEmail(user?.email);
}

/** @deprecated use isDemoAccountEmail */
export function isDemoAdminEmail(email) {
  return isDemoAccountEmail(email);
}

/** @deprecated use isDemoAccountUser */
export function isDemoAdminUser(user) {
  return isDemoAccountUser(user);
}

/**
 * Resolves a demo login account in the isolated sandbox org.
 * Uses the same UserRole / RBAC as production — only the data tenant differs.
 */
async function removeStaleDemoUser(prisma, email) {
  const stale = await prisma.user.findUnique({
    where: { email },
    include: { organization: { select: { slug: true } } },
  });
  if (stale && stale.organization?.slug !== SANDBOX_ORG_SLUG) {
    await prisma.user.delete({ where: { id: stale.id } });
  }
}

export async function ensureDemoAccount(prisma, key) {
  const config = getDemoAccountByKey(key);
  if (!config) throw new Error(`Unknown demo account key: ${key}`);

  await removeStaleDemoUser(prisma, config.email);
  await ensureSandboxReady(prisma);

  const sandbox = await prisma.organization.findUnique({
    where: { slug: SANDBOX_ORG_SLUG },
  });
  if (!sandbox) {
    await resetSandboxOrganization(prisma);
  }

  let user = await prisma.user.findUnique({
    where: { email: config.email },
    include: {
      employee: true,
      organization: true,
    },
  });

  if (!user || user.organization?.slug !== SANDBOX_ORG_SLUG) {
    await resetSandboxOrganization(prisma);
    user = await prisma.user.findUnique({
      where: { email: config.email },
      include: {
        employee: true,
        organization: true,
      },
    });
  }

  if (!user) {
    throw new Error(`Failed to initialize demo account: ${config.email}`);
  }

  return {
    user,
    employee: user.employee,
    organization: user.organization,
    config,
  };
}

export async function ensureAllDemoAccounts(prisma) {
  await ensureSandboxReady(prisma);
  const results = {};
  for (const key of DEMO_ACCOUNT_KEYS) {
    results[key] = await ensureDemoAccount(prisma, key);
  }
  return results;
}

/** @deprecated use ensureDemoAccount(prisma, 'admin') */
export async function ensureDemoAdmin(prisma) {
  return ensureDemoAccount(prisma, "admin");
}

export function buildDemoSessionPayload(dbUser, { isDemoSession = false, demoRoleKey = null } = {}) {
  return {
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
    organizationId: dbUser.organizationId,
    employeeId: dbUser.employee?.id,
    canManageEmployees: dbUser.canManageEmployees,
    canPostAnnouncements: dbUser.canPostAnnouncements,
    canApproveLeave: dbUser.canApproveLeave,
    canSubmitPerformanceReviews: dbUser.canSubmitPerformanceReviews,
    firstName: dbUser.employee?.firstName,
    name: dbUser.employee
      ? `${dbUser.employee.firstName} ${dbUser.employee.lastName}`
      : "Demo User",
    avatarUrl: dbUser.employee?.avatarUrl ?? undefined,
    isDemoSession,
    demoRoleKey,
  };
}
