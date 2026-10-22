"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * Protects /admin/* except /admin/login.
 * Once admin access is confirmed, keep rendering children even if
 * useSession briefly flips to "loading" (avoids form unmount).
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const allowedRef = useRef(false);
  const [ready, setReady] = useState(false);

  const isLoginPage =
    pathname === "/admin/login" || pathname?.startsWith("/admin/login/");

  useEffect(() => {
    // Login page must never redirect away — otherwise admin cannot sign in
    if (isLoginPage) {
      setReady(true);
      return;
    }

    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      allowedRef.current = true;
      setReady(true);
      return;
    }

    if (status === "unauthenticated") {
      allowedRef.current = false;
      setReady(true);
      router.replace("/admin/login");
      return;
    }

    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      allowedRef.current = false;
      setReady(true);
    }
  }, [status, session, router, isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!ready && status === "loading" && !allowedRef.current) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-[var(--muted)]">
        Checking access...
      </div>
    );
  }

  if (allowedRef.current || session?.user?.role === "ADMIN") {
    return <>{children}</>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[var(--muted)]">
        Redirecting to admin login…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="mb-2 text-2xl font-bold text-[var(--heading)]">
        Access denied
      </h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Only administrators can open the admin panel.
      </p>
      <Link href="/" className="btn-primary inline-flex px-6 py-2.5 text-sm">
        Back to store
      </Link>
    </div>
  );
}
