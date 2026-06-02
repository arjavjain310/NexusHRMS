"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_CREDENTIALS, IS_DEMO_MODE } from "@/lib/constants";
import { Logo } from "@/components/brand/logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  function quickLogin(demoEmail) {
    setEmail(demoEmail);
    setPassword("demo1234");
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div className="inline-flex rounded-xl bg-white/95 px-4 py-3 shadow-sm">
          <Logo variant="mark" priority showTitle className="h-10 w-10" />
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            The modern AI-first HR platform for growing companies.
          </h2>
          <p className="mt-4 text-primary-foreground/80 max-w-md">
            Manage employees, attendance, payroll, and recruitment — with intelligent automation at every step.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">© {new Date().getFullYear()} Nexus HRMS</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your workspace</CardDescription>
          </CardHeader>
          <CardContent>
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            {IS_DEMO_MODE && (
              <div className="mt-6">
                <p className="text-xs text-muted-foreground mb-3">Demo accounts (password: demo1234)</p>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_CREDENTIALS.map((c) => (
                    <Button
                      key={c.email}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs justify-start truncate"
                      onClick={() => quickLogin(c.email)}
                    >
                      {c.role.replace("_", " ")}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {!IS_DEMO_MODE && (
                <>
                  New employee?{" "}
                  <Link href="/signup" className="text-primary hover:underline">
                    Sign up
                  </Link>
                  <span className="mx-2">·</span>
                </>
              )}
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
