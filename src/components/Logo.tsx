import Link from "next/link";

const LOGO_SRC =
  "https://raw.githubusercontent.com/WebDevNinja12/hama-enterprise-store/main/logo.png";

/** Company logo — always loads from the repo so it shows on the store. */
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
