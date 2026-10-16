"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import PasswordInput from "@/components/PasswordInput";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });
    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/account");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="card w-full max-w-md p-8">
        <h1 className="mb-1 text-2xl font-bold text-[var(--heading)]">
          Welcome back
        </h1>
        <p className="mb-6 text-sm text-[var(--muted)]">
          Sign in to see your orders and account
        </p>
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
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
              autoComplete="email"
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs text-[var(--muted)]">Password</label>
              <Link
                href="/forgot-password"
                className="text-xs text-cyan-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              value={password}
              onChange={setPassword}
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-sm disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-xs text-[var(--muted)]">OR</span>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>
        <button
          onClick={() => signIn("google", { callbackUrl: "/account" })}
          className="btn-secondary flex w-full items-center justify-center gap-2 py-3 text-sm"
        >
          Continue with Google
        </button>
        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-cyan-400 hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
