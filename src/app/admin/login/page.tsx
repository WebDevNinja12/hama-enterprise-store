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
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    const em = email.trim().toLowerCase();

    // Clear any stuck browser session cookies first
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      /* ignore */
    }

    let sessionId = "";
    try {
      const pre = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: em, password }),
      });
      const data = await pre.json();
      if (!pre.ok) {
        if (data.code === "DEVICE_BLOCKED") {
          setError(data.error || "This device is blocked from admin access.");
        } else if (data.code === "LOCKED") {
          setError("Too many failed attempts. Wait 5 minutes and try again.");
        } else if (data.code === "DEVICE_LIMIT") {
          // Should not happen after reset fix — still try once more message
          setError(
            data.error ||
              "Device limit error. Refresh the page and try again after deploy."
          );
        } else {
          setError(data.error || "Invalid admin credentials.");
        }
        setLoading(false);
        return;
      }
      sessionId = data.sessionId || "";
      if (data.reset) {
        setInfo("Signed out other devices. Starting a fresh admin session…");
      }
    } catch {
      setError("Could not reach server. Try again.");
      setLoading(false);
      return;
    }

    if (!sessionId) {
      setError("Could not create admin device session. Try again.");
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
      setError(
        "Password ok but session failed. Clear cookies and try again: /clear-cookies"
      );
      setLoading(false);
      return;
    }

    try {
      const me = await fetch("/api/auth/session", { credentials: "include" });
      const data = await me.json();
      if (data?.user?.role !== "ADMIN") {
        setError("This account is not an administrator.");
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
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
            Fresh session each login · other devices signed out
          </p>
        </div>
      </div>

      {reason === "idle" && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Admin session expired due to inactivity (5 min). Sign in again.
        </div>
      )}

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
          {loading ? "Signing in…" : "Sign in to admin"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-[var(--muted)]">
        Stuck?{" "}
        <Link href="/clear-cookies" className="text-cyan-400 hover:underline">
          Clear cookies
        </Link>{" "}
        then try again.
      </p>

      <p className="mt-4 text-center text-xs text-[var(--muted)]">
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
