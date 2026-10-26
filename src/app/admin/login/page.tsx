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

    const em = email.trim().toLowerCase();

    // Device gate: max 3 admin sessions; blocks + emails on limit
    let sessionId = "";
    try {
      const pre = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, password }),
      });
      const data = await pre.json();
      if (!pre.ok) {
        if (data.code === "DEVICE_LIMIT") {
          setError(
            data.error ||
              "Maximum 3 admin devices already signed in. Revoke one from Security on an active device."
          );
        } else if (data.code === "DEVICE_BLOCKED") {
          setError(data.error || "This device is blocked from admin access.");
        } else if (data.code === "LOCKED") {
          setError("Too many failed attempts. Wait 5 minutes and try again.");
        } else {
          setError(data.error || "Invalid admin credentials.");
        }
        setLoading(false);
        return;
      }
      sessionId = data.sessionId || "";
    } catch {
      setError("Could not reach server. Try again.");
      setLoading(false);
      return;
    }

    const res = await signIn("credentials", {
      email: em,
      password,
      adminSessionId: sessionId,
      redirect: false,
    });

    if (res?.error) {
      if (res.error === "LOGIN_LOCKED" || String(res.error).includes("LOCKED")) {
        setError("Too many failed attempts. Wait 5 minutes and try again.");
      } else {
        setError("Invalid admin credentials or device session expired.");
      }
      setLoading(false);
      return;
    }

    try {
      const me = await fetch("/api/auth/session", { credentials: "include" });
      const data = await me.json();
      if (data?.user?.role !== "ADMIN") {
        setError("This account is not an administrator. Use the customer sign-in.");
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
            Staff only · max 3 devices · separate from customers
          </p>
        </div>
      </div>

      {reason === "idle" && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Admin session expired due to inactivity (15 min). Sign in again.
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
