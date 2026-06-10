"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IS_DEMO_LOGIN_ENABLED } from "@/lib/constants";
import { QUICK_DEMO_ROLES } from "@/lib/constants/demo-roles";
import { Logo } from "@/components/brand/logo";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoadingKey, setDemoLoadingKey] = useState(null);
  const [demoEnabled, setDemoEnabled] = useState(IS_DEMO_LOGIN_ENABLED);
  const [error, setError] = useState("");

  useEffect(() => {
    if (IS_DEMO_LOGIN_ENABLED) return;
    fetch("/api/auth/demo-login")
      .then((r) => r.json())
      .then((j) => setDemoEnabled(!!j.enabled))
      .catch(() => setDemoEnabled(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Login failed");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleDemoLogin(roleKey) {
    setDemoLoadingKey(roleKey);
    setError("");

    const res = await fetch("/api/auth/demo-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: roleKey }),
    });
    const data = await res.json();
    setDemoLoadingKey(null);

    if (!res.ok) {
      setError(data.error || "Demo login failed");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const anyDemoLoading = demoLoadingKey !== null;

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <Logo variant="icon" priority className="h-14 w-14 sm:h-16 sm:w-16" />
        <div>
          <p className="mb-6 text-4xl font-bold leading-tight text-primary-foreground sm:text-5xl">
            Welcome To Nexus-HRMS,
          </p>
          <h2 className="text-2xl font-semibold leading-tight sm:text-3xl">
            The modern AI-first HR platform for growing companies.
          </h2>
          <p className="mt-4 text-primary-foreground/80 max-w-md">
            Manage employees, attendance, payroll, and recruitment — with intelligent automation at every step.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">© {new Date().getFullYear()} Nexus HRMS</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-lg border-0 shadow-none lg:border lg:shadow-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Hello User,</CardTitle>
            <CardDescription>Sign in to your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            {demoEnabled && (
              <div className="mb-6 space-y-3">
                <div>
                  <p className="text-sm font-semibold">Quick Demo Accounts</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Explore the complete HRMS without creating an account.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_DEMO_ROLES.map((role) => {
                    const isLoading = demoLoadingKey === role.key;
                    return (
                      <button
                        key={role.key}
                        type="button"
                        disabled={loading || anyDemoLoading}
                        onClick={() => handleDemoLogin(role.key)}
                        className={cn(
                          "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all",
                          "disabled:opacity-60 disabled:cursor-not-allowed",
                          role.colorClass
                        )}
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold w-full">
                          <span className={cn("h-2 w-2 rounded-full shrink-0", role.dotClass)} />
                          {isLoading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Signing in…
                            </>
                          ) : (
                            role.label
                          )}
                        </span>
                        {!isLoading && (
                          <span className="text-xs opacity-80 pl-4">{role.description}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {demoEnabled && (
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or sign in with email</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading || anyDemoLoading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link href="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
              <span className="mx-2">·</span>
              <Link href="/reset-password" className="text-primary hover:underline">
                Reset password
              </Link>
              <span className="mx-2">·</span>
              <Link href="/" className="text-primary hover:underline">
                Back to home
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
