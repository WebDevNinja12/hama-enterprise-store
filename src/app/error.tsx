"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="section-label mb-2">Something went wrong</p>
      <h1 className="mb-3 text-2xl font-bold text-[var(--heading)]">
        Temporary error
      </h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        The page hit an unexpected problem. You can try again — the store will
        recover automatically when possible.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="btn-primary px-5 py-2.5 text-sm">
          Try again
        </button>
        <Link href="/" className="btn-secondary px-5 py-2.5 text-sm">
          Go home
        </Link>
      </div>
    </div>
  );
}
