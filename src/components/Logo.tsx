import Link from "next/link";

/**
 * Company logo — logo.png in repo (HAMA mark).
 * Served via /logo.png rewrite to GitHub raw asset.
 */
export default function Logo({
  className = "",
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <Link href="/" className={`flex shrink-0 items-center gap-2.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="HAMA ENTERPRISE NG"
        width={40}
        height={40}
        className="h-10 w-10 rounded-full bg-white object-contain p-0.5 ring-1 ring-cyan-500/30"
      />
      {showText && (
        <span className="hidden text-sm font-bold tracking-wide text-[var(--heading)] sm:block">
          HAMA ENTERPRISE NG
        </span>
      )}
    </Link>
  );
}
