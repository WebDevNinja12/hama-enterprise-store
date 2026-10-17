import Link from "next/link";

const MAIN_SITE = "https://hama-enterprise-ng.vercel.app/index.html";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <a
              href={MAIN_SITE}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-4 flex items-center gap-2.5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="HAMA ENTERPRISE NG"
                width={40}
                height={40}
                className="h-10 w-10 rounded-full bg-white object-contain p-0.5 ring-1 ring-cyan-500/30"
              />
              <span className="text-sm font-bold tracking-wide text-[var(--heading)]">
                HAMA ENTERPRISE NG
              </span>
            </a>
            <p className="max-w-xs text-sm leading-relaxed text-[var(--muted)]">
              Next-generation hardware and conceptual gadgets. RC: 8827959
            </p>
            <a
              href={MAIN_SITE}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm text-cyan-400 hover:underline"
            >
              hama-enterprise-ng.vercel.app
            </a>
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
              Account
            </p>
            <ul className="space-y-2 text-sm text-[var(--muted)]">
              <li>
                <Link href="/login" className="hover:text-cyan-400">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-cyan-400">
                  Create account
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-cyan-400">
                  My account
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
                <a
                  href={MAIN_SITE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-400"
                >
                  Main website
                </a>
              </li>
              <li>
                <a
                  href="https://hama-enterprise-ng.vercel.app/gallery.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-400"
                >
                  Gallery
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@hamaenterprise.ng"
                  className="hover:text-cyan-400"
                >
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
          <a
            href={MAIN_SITE}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-400 hover:underline"
          >
            {MAIN_SITE.replace("https://", "")}
          </a>
        </div>
      </div>
    </footer>
  );
}
