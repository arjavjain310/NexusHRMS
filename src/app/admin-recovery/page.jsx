"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";

export default function AdminRecoveryPage() {
  const router = useRouter();
  const [step, setStep] = useState("email");
  const [workEmail, setWorkEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");

  async function requestOtp(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const res = await fetch("/api/auth/admin-recovery/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workEmail }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Could not send OTP");
      return;
    }

    setMaskedEmail(data.maskedRecoveryEmail || "your recovery email");
    setMessage(data.message || "OTP sent.");
    setStep("reset");
  }

  async function resendOtp() {
    setOtp("");
    setError("");
    setMessage("");
    setLoading(true);

    const res = await fetch("/api/auth/admin-recovery/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workEmail }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Could not resend OTP");
      return;
    }
    setMessage(data.message || "A new OTP was sent.");
  }

  async function resetPassword(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/admin-recovery/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workEmail, otp, newPassword, confirmPassword }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Recovery failed");
      return;
    }

    setMessage(data.message || "Password updated.");
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <Logo variant="icon" priority className="h-14 w-14 sm:h-16 sm:w-16" />
        <div>
          <p className="mb-4 text-3xl font-bold leading-tight">Admin password recovery</p>
          <p className="text-primary-foreground/80 max-w-md">
            No approval from another user is required. Enter your admin work email, verify the OTP
            sent to your registered recovery address, then set a new password.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-primary-foreground/90 list-disc list-inside">
            <li>OTP expires in 10 minutes</li>
            <li>Single-use codes only</li>
            <li>Request a new OTP anytime if expired</li>
          </ul>
        </div>
        <p className="text-sm text-primary-foreground/60">© {new Date().getFullYear()} Nexus HRMS</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Admin recovery</CardTitle>
            <CardDescription>
              {step === "email"
                ? "Enter your admin work email to receive a secure OTP."
                : `Enter the OTP sent to ${maskedEmail} and choose a new password.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "email" ? (
              <form onSubmit={requestOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="work-email">Admin work email</Label>
                  <Input
                    id="work-email"
                    type="email"
                    placeholder="arjav@nexushrms.com"
                    value={workEmail}
                    onChange={(e) => setWorkEmail(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                {message && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending…" : "Send OTP"}
                </Button>
              </form>
            ) : (
              <form onSubmit={resetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">One-time code (OTP)</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    required
                  />
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
                  {loading ? "Updating…" : "Set new password"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                  onClick={resendOtp}
                >
                  Resend OTP
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setError("");
                    setMessage("");
                  }}
                >
                  Use a different email
                </Button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                Back to sign in
              </Link>
              <span className="mx-2">·</span>
              <Link href="/reset-password" className="text-primary hover:underline">
                Employee reset
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
