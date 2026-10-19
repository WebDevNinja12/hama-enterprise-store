"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";

const MESSAGES: Record<
  string,
  { title: string; body: string; action?: string }
> = {
  "400": {
    title: "Bad request",
    body: "The request was invalid. Please go back and try again.",
  },
  "401": {
    title: "Sign in required",
    body: "Your session expired or you are not signed in.",
    action: "/login",
  },
  "403": {
    title: "Access denied",
    body: "You do not have permission to view this page.",
  },
  "404": {
    title: "Not found",
    body: "We could not find what you were looking for.",
  },
  "413": {
    title: "Upload too large",
    body: "The file or request body is too large. Use a smaller image.",
  },
  "429": {
    title: "Too many requests",
    body: "You are going too fast. Wait about a minute, then try again.",
  },
  "431": {
    title: "Cookies too large",
    body: "Your browser sent oversized cookies. Clearing them now — then sign in again.",
    action: "/login",
  },
  "494": {
    title: "Request header too large (494)",
    body: "Browser cookies were too big. We are clearing them automatically — then sign in again.",
    action: "/login",
  },
  "500": {
    title: "Server error",
    body: "Something failed on our side. Please try again in a moment.",
  },
  "502": {
    title: "Bad gateway",
    body: "A temporary upstream issue occurred. Retry shortly.",
  },
  "503": {
    title: "Service unavailable",
    body: "The store is briefly unavailable. Try again shortly.",
  },
  "504": {
    title: "Timeout",
    body: "The server took too long. Please try again.",
  },
};

function ErrorBody() {
  const sp = useSearchParams();
  const code = sp.get("code") || "500";
  const info = MESSAGES[code] || MESSAGES["500"];
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    if (code === "494" || code === "431") {
      fetch("/api/clear-cookies", { method: "POST", credentials: "include" })
        .then(() => setCleared(true))
        .catch(() => setCleared(true));
    }
  }, [code]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl font-bold text-cyan-400/40">{code}</p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--heading)]">
        {info.title}
      </h1>
      <p className="mt-2 mb-2 text-sm text-[var(--muted)]">{info.body}</p>
      {(code === "494" || code === "431") && (
        <p className="mb-6 text-xs text-emerald-400">
          {cleared
            ? "Cookies cleared. You can sign in again."
            : "Clearing cookies…"}
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            fetch("/api/clear-cookies", {
              method: "POST",
              credentials: "include",
            }).finally(() => {
              window.location.href = info.action || "/";
            });
          }}
          className="btn-primary px-5 py-2.5 text-sm"
        >
          Clear cookies & continue
        </button>
        <Link href="/" className="btn-secondary px-5 py-2.5 text-sm">
          Home
        </Link>
      </div>
      {(code === "494" || code === "431") && (
        <p className="mt-6 max-w-sm text-[11px] text-[var(--muted)]">
          If the site still will not load: open browser settings → clear site
          data for this domain, or use a private/incognito window.
        </p>
      )}
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-[var(--muted)]">Loading...</div>
      }
    >
      <ErrorBody />
    </Suspense>
  );
}
