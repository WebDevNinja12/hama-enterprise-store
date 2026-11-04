"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [checkingPw, setCheckingPw] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/admin/login");
      return;
    }

    if (session?.user?.role !== "ADMIN") {
      router.replace("/login");
      return;
    }

    // Force password setup on first login
    if (pathname === "/admin/set-password") {
      setCheckingPw(false);
      return;
    }

    let cancelled = false;
    fetch("/api/admin/set-password", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.mustChangePassword) {
          router.replace("/admin/set-password");
        } else {
          setCheckingPw(false);
        }
      })
      .catch(() => {
        if (!cancelled) setCheckingPw(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, session, router, pathname]);

  if (status === "loading" || checkingPw) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-[var(--muted)]">
        Checking access…
      </div>
    );
  }

  if (session?.user?.role !== "ADMIN") return null;

  return <>{children}</>;
}
