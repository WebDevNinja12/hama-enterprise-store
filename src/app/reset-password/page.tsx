"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import PasswordInput from "@/components/PasswordInput";

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
      <p className="mb-6 text-sm text-[var(--muted)]">
        {email ? `Account: ${email}` : "Enter your new password below."}
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
          disabled={loading}
          className="btn-primary w-full py-3 text-sm disabled:opacity-50"
        >
          {loading ? "Saving..." : "Update password"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        <Link href="/login" className="text-cyan-400 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <Suspense
        fallback={
          <p className="text-[var(--muted)]">Loading...</p>
        }
      >
        <ResetForm />
      </Suspense>
    </div>
  );
}
