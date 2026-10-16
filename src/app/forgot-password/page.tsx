"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      if (data.found && data.resetPath) {
        setMessage("Account found. Redirecting to reset form...");
        router.push(data.resetPath);
        return;
      }

      setMessage(
        data.message ||
          "If an account exists for that email, follow the next steps to reset."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="card w-full max-w-md p-8">
        <h1 className="mb-1 text-2xl font-bold text-[var(--heading)]">
          Reset password
        </h1>
        <p className="mb-6 text-sm text-[var(--muted)]">
          Enter the email on your account. We&apos;ll take you to set a new
          password.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-300">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-[var(--muted)]">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-sm disabled:opacity-50"
          >
            {loading ? "Checking..." : "Continue"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          <Link href="/login" className="text-cyan-400 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
