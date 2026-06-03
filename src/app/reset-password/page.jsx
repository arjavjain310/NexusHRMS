"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_COMPANY_PASSWORD } from "@/lib/constants";
import { Logo } from "@/components/brand/logo";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        currentPassword,
        newPassword,
        confirmPassword,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Password reset failed");
      return;
    }

    setMessage(data.message || "Password updated successfully.");
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <Logo variant="icon" priority className="h-14 w-14 sm:h-16 sm:w-16" />
        <div>
          <p className="mb-4 text-3xl font-bold leading-tight">Reset your password</p>
          <p className="text-primary-foreground/80 max-w-md">
            New employees receive the default company password. Enter it below, then choose a
            personal password you will use to sign in.
          </p>
          <p className="mt-6 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm">
            <span className="font-medium">Default password:</span>{" "}
            <code className="font-mono">{DEFAULT_COMPANY_PASSWORD}</code>
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">© {new Date().getFullYear()} Nexus HRMS</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Reset password</CardTitle>
            <CardDescription>
              Use your work email and current password (default for new staff:{" "}
              <span className="font-mono font-medium">{DEFAULT_COMPANY_PASSWORD}</span>)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@nexushrms.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current">Current password</Label>
                <Input
                  id="current"
                  type="password"
                  placeholder={DEFAULT_COMPANY_PASSWORD}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Default for new employees: <span className="font-mono">{DEFAULT_COMPANY_PASSWORD}</span>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">New password</Label>
                <Input
                  id="new"
                  type="password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input
                  id="confirm"
                  type="password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {message && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating…" : "Update password"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                Back to sign in
              </Link>
              <span className="mx-2">·</span>
              <Link href="/" className="text-primary hover:underline">
                Home
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
