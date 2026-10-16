"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import PasswordInput from "@/components/PasswordInput";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      setInfo(data.message || "Check your email for the OTP code.");
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");

      // Auto sign-in after verify
      const login = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (login?.error) {
        router.push("/login");
        return;
      }

      router.push("/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setLoading(false);
    }
  }

  async function handleResend() {
    setLoading(true);
    setError("");
    setInfo("");
    try {
      const res = await fetch("/api/register/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not resend");
      setInfo(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="card w-full max-w-md p-8">
        <h1 className="mb-1 text-2xl font-bold text-[var(--heading)]">
          {step === "form" ? "Create account" : "Verify your email"}
        </h1>
        <p className="mb-6 text-sm text-[var(--muted)]">
          {step === "form"
            ? "We will send a one-time code (OTP) to your email."
            : `Enter the 6-digit code sent to ${email}`}
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-300">
            {info}
          </div>
        )}

        {step === "form" ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-[var(--muted)]">
                Name
              </label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-[var(--muted)]">
                Email
              </label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-[var(--muted)]">
                Password
              </label>
              <PasswordInput
                value={password}
                onChange={setPassword}
                required
                minLength={8}
                placeholder="Min 8 characters"
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm disabled:opacity-50"
            >
              {loading ? "Sending code..." : "Continue — send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-[var(--muted)]">
                OTP code
              </label>
              <input
                className="input text-center text-2xl tracking-[0.4em]"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                minLength={6}
                maxLength={6}
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="btn-primary w-full py-3 text-sm disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & create account"}
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="btn-secondary w-full py-2.5 text-sm disabled:opacity-50"
            >
              Resend code
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setOtp("");
                setError("");
                setInfo("");
              }}
              className="w-full text-center text-sm text-[var(--muted)] hover:text-cyan-400"
            >
              Change email
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-cyan-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
