"use client";

type Props = {
  src?: string | null;
  poster?: string | null;
  className?: string;
  controls?: boolean;
};

function isPlayable(url?: string | null) {
  if (!url || typeof url !== "string") return false;
  const t = url.trim();
  if (!t || t.startsWith("data:") || t.startsWith("blob:")) return false;
  return t.startsWith("https://") || t.startsWith("http://") || t.startsWith("/");
}

/** Reliable MP4 playback (Blob / direct https). */
export default function SafeVideo({
  src,
  poster,
  className = "h-full w-full object-cover",
  controls = true,
}: Props) {
  if (!isPlayable(src)) {
    return (
      <div
        className={`flex items-center justify-center bg-black/40 text-xs text-[var(--muted)] ${className}`}
      >
        Video unavailable — use an https MP4 URL (Vercel Blob)
      </div>
    );
  }

  return (
    <video
      key={src!}
      src={src!}
      poster={isPlayable(poster) ? poster! : undefined}
      controls={controls}
      playsInline
      preload="metadata"
      className={className}
      // muted helps autoplay policies; user can unmute via controls
      controlsList="nodownload"
    >
      <source src={src!} type="video/mp4" />
      Your browser does not support MP4 video.
    </video>
  );
}
