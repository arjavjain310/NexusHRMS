import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/signup", "/reset-password", "/api/auth"];
const AUTH_PATHS = ["/login", "/signup"];

function parseDemoSessionCookie(request) {
  const raw = request.cookies.get("nexus_demo_session")?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.email && parsed?.role) return parsed;
  } catch {
    return null;
  }
  return null;
}

function isDemoLoginEnabled() {
  return (
    process.env.DEMO_MODE === "true" || process.env.ENABLE_DEMO_LOGIN === "true"
  );
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isApi = pathname.startsWith("/api/");
  const isStatic =
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon");

  if (isStatic || isApi) {
    return NextResponse.next();
  }

  const demoCookie = parseDemoSessionCookie(request);
  const demoSessionActive =
    !!demoCookie && (isDemoLoginEnabled() || process.env.DEMO_MODE === "true");

  if (demoSessionActive) {
    if (AUTH_PATHS.includes(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (!isPublic && pathname.startsWith("/dashboard")) {
      return NextResponse.next();
    }
    if (!isPublic && !pathname.startsWith("/login") && pathname !== "/") {
      const protectedPrefixes = [
        "/employees",
        "/attendance",
        "/leave",
        "/leave-management",
        "/payroll",
        "/performance",
        "/recruitment",
        "/ai-assistant",
        "/holidays",
        "/me",
        "/approvals",
      ];
      if (protectedPrefixes.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  if (process.env.DEMO_MODE !== "true" && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { updateSession } = await import("@/lib/supabase/middleware");
      return updateSession(request);
    } catch (e) {
      // fall through
    }
  }

  const isAuthenticated = !!demoCookie;
  if (AUTH_PATHS.includes(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (!isPublic && !isAuthenticated && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (!isPublic && !isAuthenticated && !pathname.startsWith("/login") && pathname !== "/") {
    const protectedPrefixes = [
      "/employees",
      "/attendance",
      "/leave",
      "/leave-management",
      "/payroll",
      "/performance",
      "/recruitment",
      "/ai-assistant",
      "/holidays",
    ];
    if (protectedPrefixes.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
