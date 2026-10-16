import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-bold text-cyan-400">
                H
              </div>
              <span className="text-sm font-bold tracking-wide text-[var(--heading)]">
                HAMA ENTERPRISE NG
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-[var(--muted)]">
              Next-generation hardware and conceptual gadgets. RC: 8827959
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--heading)]">
              Shop
            </p>
            <ul className="space-y-2 text-sm text-[var(--muted)]">
              <li>
                <Link href="/catalog" className="hover:text-cyan-400">
                  Catalog
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-cyan-400">
                  Cart
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="hover:text-cyan-400">
                  Checkout
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--heading)]">
              Company
            </p>
            <ul className="space-y-2 text-sm text-[var(--muted)]">
              <li>
                <Link href="/login" className="hover:text-cyan-400">
                  Account
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-cyan-400">
                  Admin
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--heading)]">
              Support
            </p>
            <ul className="space-y-2 text-sm text-[var(--muted)]">
              <li>
                <a href="mailto:support@hamaenterprise.ng" className="hover:text-cyan-400">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[var(--border)] pt-6 sm:flex-row">
          <p className="text-xs text-[var(--muted)]">
            © {new Date().getFullYear()} Hama Enterprise NG. All rights reserved.
          </p>
          <p className="text-xs text-[var(--muted)]">Built for the future · Nigeria</p>
        </div>
      </div>
    </footer>
  );
}
