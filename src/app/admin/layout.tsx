"use client";

import AdminGuard from "@/components/AdminGuard";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin =
    pathname === "/admin/login" || pathname?.startsWith("/admin/login/");

  // Login page must not go through AdminGuard redirect logic
  if (isLogin) {
    return <>{children}</>;
  }

  return <AdminGuard>{children}</AdminGuard>;
}
