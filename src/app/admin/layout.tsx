import AdminGuard from "@/components/AdminGuard";

/**
 * Admin section layout.
 * /admin/login is still under this tree but AdminGuard renders children
 * without auth checks on the login path.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminGuard>{children}</AdminGuard>;
}
