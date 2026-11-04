"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, Mail, Shield } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";

export default function AdminSettingsPage() {
  const [email, setEmail] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/profile", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.email) {
          setCurrentEmail(d.user.email);
          setEmail(d.user.email);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setErr("");
    setEmailBusy(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Could not update email");
        return;
      }
      setCurrentEmail(data.user?.email || email);
      setMsg(data.message || "Email updated");
    } catch {
      setErr("Network error");
    } finally {
      setEmailBusy(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
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
          <p className="text-xs text-[var(--muted)]">Email & password</p>
        </div>
      </div>

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

      <div className="card mb-6 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Mail className="h-4 w-4 text-cyan-400" />
          <h2 className="font-semibold text-[var(--heading)]">Admin email</h2>
        </div>
        <p className="mb-3 text-xs text-[var(--muted)]">
          Current login email:{" "}
          <strong className="text-[var(--heading)]">
            {loading ? "…" : currentEmail || "(unknown)"}
          </strong>
        </p>
        <form onSubmit={saveEmail} className="space-y-3">
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hamaenterprisestore01@gmail.com"
            required
          />
          <button
            type="submit"
            disabled={emailBusy}
            className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
          >
            {emailBusy ? "Saving…" : "Update email"}
          </button>
        </form>
        <p className="mt-2 text-[11px] text-[var(--muted)]">
          After changing, sign out and sign in again with the new email.
        </p>
      </div>

      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-cyan-400" />
          <h2 className="font-semibold text-[var(--heading)]">Change password</h2>
        </div>
        <form onSubmit={savePassword} className="space-y-4">
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
        <Link href="/admin/security" className="text-cyan-400 hover:underline">
          Security / devices
        </Link>
      </p>
    </div>
  );
}
