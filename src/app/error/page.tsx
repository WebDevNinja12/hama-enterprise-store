"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

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
    body: "The file or request body is too large. Use a smaller image (under 600KB).",
  },
  "429": {
    title: "Too many requests",
    body: "You are going too fast. Wait about a minute, then try again.",
  },
  "431": {
    title: "Cookies too large",
    body: "Your browser sent oversized cookies. We cleared them — sign in again.",
    action: "/login",
  },
  "494": {
    title: "Request header too large",
    body: "Browser cookies were too big. Clear site cookies or use a private window, then sign in again.",
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
    body: "The store is briefly unavailable. Automatic recovery is in progress.",
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

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl font-bold text-cyan-400/40">{code}</p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--heading)]">
        {info.title}
      </h1>
      <p className="mt-2 mb-6 text-sm text-[var(--muted)]">{info.body}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn-primary px-5 py-2.5 text-sm"
        >
          Retry
        </button>
        <Link
          href={info.action || "/"}
          className="btn-secondary px-5 py-2.5 text-sm"
        >
          {info.action ? "Sign in" : "Home"}
        </Link>
      </div>
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
