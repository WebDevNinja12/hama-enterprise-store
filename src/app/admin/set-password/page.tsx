"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PasswordInput from "@/components/PasswordInput";
import { KeyRound } from "lucide-react";

export default function AdminSetPasswordPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/admin/login");
      return;
    }
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.replace("/login");
      return;
    }
    fetch("/api/admin/set-password", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.email) setEmail(d.email);
        if (d.mustChangePassword === false) {
          router.replace("/admin");
        }
      })
      .catch(() => {});
  }, [status, session, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (newPassword.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Could not save password");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[var(--muted)]">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="card w-full max-w-md p-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--heading)]">Set admin password</h1>
            <p className="text-xs text-[var(--muted)]">
              First login for {email || "your admin account"}
            </p>
          </div>
        </div>

        <p className="mb-5 text-sm text-[var(--muted)]">
          Choose a permanent password for{" "}
          <strong className="text-[var(--heading)]">
            hamaenterprisestore01@gmail.com
          </strong>
          . You will use this for all future admin sign-ins.
        </p>

        {err && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-[var(--muted)]">New password</label>
            <PasswordInput
              value={newPassword}
              onChange={setNewPassword}
              required
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[var(--muted)]">Confirm password</label>
            <PasswordInput
              value={confirm}
              onChange={setConfirm}
              required
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="btn-primary w-full py-3 text-sm disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save password and continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
