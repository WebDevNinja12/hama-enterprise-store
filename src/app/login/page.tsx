"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import PasswordInput from "@/components/PasswordInput";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") || "/account";
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
      // NextAuth may surface CredentialsSignin for EMAIL_NOT_VERIFIED too
      setError(
        "Invalid email/password, or email not verified. Check your inbox for the OTP and finish registration."
      );
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="card w-full max-w-md p-8">
      <h1 className="mb-1 text-2xl font-bold text-[var(--heading)]">
        Welcome back
      </h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Sign in to checkout and view your orders
      </p>
      {callbackUrl.includes("checkout") && (
        <div className="mb-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-300">
          You need an account to checkout. Sign in or{" "}
          <Link
            href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="underline"
          >
            create one
          </Link>
          .
        </div>
      )}
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
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Don&apos;t have an account?{" "}
        <Link
          href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-medium text-cyan-400 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <Suspense fallback={<p className="text-[var(--muted)]">Loading...</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
