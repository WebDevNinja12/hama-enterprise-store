"use client";

import AdminGuard from "@/components/AdminGuard";
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
    return <>{children}</>;
  }

  return <AdminGuard>{children}</AdminGuard>;
}
