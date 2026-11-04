"use client";

import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublic =
    pathname === "/admin/login" ||
    pathname?.startsWith("/admin/login/") ||
    pathname === "/admin/set-password" ||
    pathname?.startsWith("/admin/set-password/");

  if (isPublic) {
    return (
      <div className="relative min-h-[80vh] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.12),_transparent_55%)]" />
        <div className="relative">{children}</div>
      </div>
    );
  }

  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}
