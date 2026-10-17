import Link from "next/link";

/** Logo from repository root logo.png */
const LOGO_SRC = "/logo.png";

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
        src={LOGO_SRC}
        alt="HAMA ENTERPRISE NG"
        width={40}
        height={40}
        className="h-10 w-10 rounded-xl object-cover ring-1 ring-cyan-500/30"
        onError={(e) => {
          // fallback to svg if png missing in public/
          (e.target as HTMLImageElement).src = "/logo.svg";
        }}
      />
      {showText && (
        <span className="hidden text-sm font-bold tracking-wide text-[var(--heading)] sm:block">
          HAMA ENTERPRISE NG
        </span>
      )}
    </Link>
  );
}
