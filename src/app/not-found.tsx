import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-cyan-400/40">404</p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--heading)]">
        Page not found
      </h1>
      <p className="mt-2 mb-6 text-sm text-[var(--muted)]">
        This page does not exist or was moved.
      </p>
      <Link href="/" className="btn-primary px-6 py-2.5 text-sm">
        Back to store
      </Link>
    </div>
  );
}
