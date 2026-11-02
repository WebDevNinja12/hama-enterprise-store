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
  const [showForceClear, setShowForceClear] = useState(false);

  async function doLogin(forceClearDevices: boolean) {
    setLoading(true);
    setError("");
    setInfo("");

    const em = email.trim().toLowerCase();

    let sessionId = "";
    try {
      const pre = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, password, forceClearDevices }),
      });
      const data = await pre.json();
      if (!pre.ok) {
        if (data.code === "DEVICE_LIMIT") {
          setShowForceClear(true);
          setError(
            data.error ||
              "Device limit reached. Use Clear other devices below if this is you."
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
      if (data.pruned > 0) {
        setInfo(`Cleared ${data.pruned} expired device session(s).`);
      }
      if (data.forced) {
        setInfo("Other admin devices were signed out.");
      }
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await doLogin(false);
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
            Staff only · max 3 devices · 5 min idle timeout
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
          {loading ? "Verifying…" : "Sign in to admin"}
        </button>
      </form>

      {showForceClear && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="mb-3 text-xs text-amber-100/90">
            Old device slots may still be reserved even if you are not signed in
            elsewhere. This signs out every other admin device, then logs you in.
          </p>
          <button
            type="button"
            disabled={loading || !email || !password}
            onClick={() => doLogin(true)}
            className="w-full rounded-full bg-amber-500/20 px-4 py-2.5 text-sm font-semibold text-amber-200 ring-1 ring-amber-500/40 hover:bg-amber-500/30 disabled:opacity-50"
          >
            Clear other devices and sign in
          </button>
        </div>
      )}

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
