"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, Trash2, Ban, ArrowLeft } from "lucide-react";

type Device = {
  id: string;
  sessionId: string;
  deviceLabel: string | null;
  ip: string | null;
  userAgent: string | null;
  lastActiveAt: string;
  createdAt: string;
  active: boolean;
  revokedAt: string | null;
};

type Blocked = {
  id: string;
  ip: string | null;
  userAgent: string | null;
  reason: string | null;
  createdAt: string;
};

export default function AdminSecurityPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [blocked, setBlocked] = useState<Blocked[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/devices", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDevices(data.devices || []);
      setBlocked(data.blocked || []);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function revoke(id: string) {
    if (!confirm("Revoke this device session? It will be signed out.")) return;
    await fetch(`/api/admin/devices?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    setMsg("Session revoked");
    load();
  }

  async function blockDevice(d: Device) {
    if (!confirm(`Block this device/IP from admin login?\nIP: ${d.ip}`)) return;
    await fetch("/api/admin/devices", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "block",
        ip: d.ip,
        userAgent: d.userAgent,
        reason: "Blocked from Security panel",
      }),
    });
    await revoke(d.id);
    setMsg("Device blocked and session revoked");
    load();
  }

  async function unblock(id: string) {
    await fetch(`/api/admin/devices?blockId=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    setMsg("Unblocked");
    load();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-2 text-sm text-cyan-400"
      >
        <ArrowLeft className="h-4 w-4" /> Admin home
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--heading)]">
            Admin security
          </h1>
          <p className="text-xs text-[var(--muted)]">
            Max 3 devices · block extras · short idle timeout (15 min)
          </p>
        </div>
      </div>

      {msg && (
        <p className="mb-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">
          {msg}
        </p>
      )}

      {loading ? (
        <p className="text-[var(--muted)]">Loading…</p>
      ) : (
        <>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Active & recent sessions
          </h2>
          <div className="mb-10 space-y-3">
            {devices.length === 0 && (
              <p className="text-sm text-[var(--muted)]">No sessions recorded.</p>
            )}
            {devices.map((d) => (
              <div key={d.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[var(--heading)]">
                      {d.deviceLabel || "Device"}{" "}
                      {d.active ? (
                        <span className="ml-2 text-xs text-emerald-400">Active</span>
                      ) : (
                        <span className="ml-2 text-xs text-zinc-500">Revoked</span>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">IP: {d.ip || "—"}</p>
                    <p className="mt-1 break-all text-xs text-[var(--muted)]">
                      {d.userAgent?.slice(0, 120)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Last active: {new Date(d.lastActiveAt).toLocaleString()}
                    </p>
                  </div>
                  {d.active && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => revoke(d.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-[var(--heading)]"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Revoke
                      </button>
                      <button
                        type="button"
                        onClick={() => blockDevice(d)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs text-red-300"
                      >
                        <Ban className="h-3.5 w-3.5" /> Block
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Blocked devices / IPs
          </h2>
          <div className="space-y-3">
            {blocked.length === 0 && (
              <p className="text-sm text-[var(--muted)]">None blocked.</p>
            )}
            {blocked.map((b) => (
              <div
                key={b.id}
                className="card flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div>
                  <p className="text-sm text-[var(--heading)]">IP: {b.ip || "—"}</p>
                  <p className="text-xs text-[var(--muted)]">{b.reason}</p>
                </div>
                <button
                  type="button"
                  onClick={() => unblock(b.id)}
                  className="text-xs text-cyan-400"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
