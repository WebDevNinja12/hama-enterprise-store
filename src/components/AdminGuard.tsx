"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-[var(--muted)]">
        Checking access...
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (session?.user?.role !== "ADMIN") {
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

  return <>{children}</>;
}
