import { NextResponse } from "next/server";
const PUBLIC_PATHS = ["/", "/login", "/signup", "/reset-password", "/admin-recovery", "/api/auth"];
const AUTH_PATHS = ["/login", "/signup"];
export async function middleware(request) {
  const {
    pathname
  } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`));
  const isApi = pathname.startsWith("/api/");
  const isStatic = pathname.startsWith("/_next") || pathname.includes(".") || pathname.startsWith("/favicon");
  if (isStatic || isApi) {
    if (process.env.DEMO_MODE !== "true" && isApi && pathname.startsWith("/api/auth/callback")) {
      // allow
    }
    return NextResponse.next();
  }
  const demoSession = request.cookies.get("nexus_demo_session")?.value;
  const isAuthenticated = !!demoSession;
  if (process.env.DEMO_MODE !== "true" && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const {
        updateSession
      } = await import("@/lib/supabase/middleware");
      return updateSession(request);
    } catch (e) {
      // fall through
    }
  }
  if (AUTH_PATHS.includes(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (!isPublic && !isAuthenticated && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (!isPublic && !isAuthenticated && !pathname.startsWith("/login") && pathname !== "/") {
    const protectedPrefixes = ["/employees", "/attendance", "/leave", "/payroll", "/performance", "/recruitment", "/ai-assistant", "/holidays", "/settings"];
    if (protectedPrefixes.some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
  return NextResponse.next();
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};