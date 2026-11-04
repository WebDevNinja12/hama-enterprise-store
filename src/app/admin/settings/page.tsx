"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, Shield } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";

export default function AdminSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setErr("");

    if (newPassword.length < 8) {
      setErr("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setErr("New password and confirmation do not match.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Update failed");
        return;
      }
      setMsg(data.message || "Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch {
      setErr("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-2 text-sm text-cyan-400 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to admin
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--heading)]">Admin settings</h1>
          <p className="text-xs text-[var(--muted)]">Password & account security</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-cyan-400" />
          <h2 className="font-semibold text-[var(--heading)]">Change password</h2>
        </div>
        <p className="mb-5 text-xs text-[var(--muted)]">
          After changing, use the new password at{" "}
          <span className="text-[var(--heading)]">/admin/login</span>. Email stays the same
          unless you change it in the database.
        </p>

        {err && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {err}
          </div>
        )}
        {msg && (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            {msg}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-[var(--muted)]">
              Current password
            </label>
            <PasswordInput
              value={currentPassword}
              onChange={setCurrentPassword}
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[var(--muted)]">New password</label>
            <PasswordInput
              value={newPassword}
              onChange={setNewPassword}
              required
              autoComplete="new-password"
            />
            <p className="mt-1 text-[11px] text-[var(--muted)]">Minimum 8 characters</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[var(--muted)]">
              Confirm new password
            </label>
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
            {busy ? "Saving…" : "Update password"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-xs text-[var(--muted)]">
        Device / session list:{" "}
        <Link href="/admin/security" className="text-cyan-400 hover:underline">
          Security
        </Link>
      </p>
    </div>
  );
}
