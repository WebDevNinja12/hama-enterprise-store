"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import PasswordInput from "@/components/PasswordInput";

function formatSeconds(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ResetForm() {
  const router = useRouter();
  const search = useSearchParams();
  const email = search.get("email") || "";
  const token = search.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(90);

  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (!token || !email) {
      setError("Invalid reset link. Request a new one.");
      return;
    }
    if (secondsLeft <= 0) {
      setError("This link has expired. Request a new reset email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      setSuccess(data.message || "Password updated");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card w-full max-w-md p-8">
      <h1 className="mb-1 text-2xl font-bold text-[var(--heading)]">
        Choose a new password
      </h1>
      <p className="mb-2 text-sm text-[var(--muted)]">
        {email ? `Account: ${email}` : "Enter your new password below."}
      </p>
      <p
        className={`mb-6 font-mono text-lg font-bold tabular-nums ${
          secondsLeft <= 20 ? "text-red-400" : "text-amber-400"
        }`}
      >
        Time left: {formatSeconds(secondsLeft)}
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs text-[var(--muted)]">
            New password
          </label>
          <PasswordInput
            value={password}
            onChange={setPassword}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Min 8 characters"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-[var(--muted)]">
            Confirm password
          </label>
          <PasswordInput
            value={confirm}
            onChange={setConfirm}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Repeat password"
          />
        </div>
        <button
          type="submit"
          disabled={loading || secondsLeft <= 0}
          className="btn-primary w-full py-3 text-sm disabled:opacity-50"
        >
          {loading ? "Saving..." : "Update password"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        <Link href="/forgot-password" className="text-cyan-400 hover:underline">
          Request a new link
        </Link>
        {" · "}
        <Link href="/login" className="text-cyan-400 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <Suspense fallback={<p className="text-[var(--muted)]">Loading...</p>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
