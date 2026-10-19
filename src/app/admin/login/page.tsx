"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import PasswordInput from "@/components/PasswordInput";
import { Shield } from "lucide-react";

function AdminLoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const reason = search.get("reason");
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
      if (res.error === "LOGIN_LOCKED" || String(res.error).includes("LOCKED")) {
        setError("Too many failed attempts. Wait 5 minutes and try again.");
      } else {
        setError("Invalid admin credentials.");
      }
      setLoading(false);
      return;
    }

    // Verify role is ADMIN — customers cannot use this portal
    try {
      const me = await fetch("/api/auth/session", { credentials: "include" });
      const data = await me.json();
      if (data?.user?.role !== "ADMIN") {
        setError("This account is not an administrator. Use the customer sign-in.");
        // Sign out non-admin from admin portal
        await fetch("/api/auth/signout", { method: "POST" }).catch(() => {});
        setLoading(false);
        return;
      }
    } catch {
      setError("Could not verify admin access.");
      setLoading(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <div className="card w-full max-w-md p-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--heading)]">Admin sign in</h1>
          <p className="text-xs text-[var(--muted)]">
            Staff only · separate from customer login
          </p>
        </div>
      </div>

      {reason === "idle" && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Admin session expired due to inactivity. Sign in again.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs text-[var(--muted)]">
            Admin email
          </label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
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
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 text-sm disabled:opacity-50"
        >
          {loading ? "Verifying…" : "Sign in to admin"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-[var(--muted)]">
        Customer?{" "}
        <Link href="/login" className="text-cyan-400 hover:underline">
          Use the public sign-in
        </Link>
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <Suspense fallback={<p className="text-[var(--muted)]">Loading...</p>}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
