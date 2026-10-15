import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-400">H</div>
          <div>
            <p className="text-sm font-semibold text-white">HAMA ENTERPRISE NG</p>
            <p className="text-xs text-[var(--muted)]">Next-generation hardware and conceptual gadgets. RC: 8827959</p>
          </div>
        </div>
        <div className="flex gap-6 text-sm text-[var(--muted)]">
          <Link href="/support" className="hover:text-cyan-400">Support</Link>
          <Link href="/catalog" className="hover:text-cyan-400">Catalog</Link>
          <Link href="/admin" className="hover:text-cyan-400">Admin</Link>
        </div>
        <p className="text-xs text-[var(--muted)]">© {new Date().getFullYear()} Hama Enterprise NG. All rights reserved.</p>
      </div>
    </footer>
  );
}
