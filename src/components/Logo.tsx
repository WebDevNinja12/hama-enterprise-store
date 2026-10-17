import Link from "next/link";

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
        src="/logo.svg"
        alt="HAMA ENTERPRISE NG"
        width={36}
        height={36}
        className="h-9 w-9 rounded-xl"
      />
      {showText && (
        <span className="hidden text-sm font-bold tracking-wide text-[var(--heading)] sm:block">
          HAMA ENTERPRISE NG
        </span>
      )}
    </Link>
  );
}
