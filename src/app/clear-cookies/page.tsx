"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/** Standalone recovery page when 494 blocks the rest of the site */
export default function ClearCookiesPage() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/clear-cookies", { method: "POST", credentials: "include" })
      .then(() => setDone(true))
      .catch(() => setDone(true));
  }, []);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-bold text-[var(--heading)]">
        {done ? "Cookies cleared" : "Clearing cookies…"}
      </h1>
      <p className="mt-2 mb-6 text-sm text-[var(--muted)]">
        This fixes error 494 (request header too large) caused by oversized
        browser cookies.
      </p>
      <Link href="/login" className="btn-primary px-6 py-2.5 text-sm">
        Sign in again
      </Link>
    </div>
  );
}
