"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const FALLBACK =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80";

type Props = Omit<ImageProps, "src" | "alt"> & {
  src?: string | null;
  alt: string;
  /** Prefer fill inside a sized parent for responsive cards */
  useFill?: boolean;
};

/**
 * Next.js Image with WebP/AVIF (via next.config), sizes, blur placeholder,
 * and broken-URL fallback. Avoids plain <img loading="lazy"> pitfalls.
 */
export default function SafeImage({
  src,
  alt,
  useFill,
  className,
  sizes = "(max-width: 768px) 100vw, 33vw",
  ...rest
}: Props) {
  const initial =
    src && typeof src === "string" && !src.startsWith("data:") ? src : FALLBACK;
  const [current, setCurrent] = useState(initial);
  const [failed, setFailed] = useState(false);

  const common = {
    alt,
    className,
    sizes,
    quality: 75 as const,
    onError: () => {
      if (!failed) {
        setFailed(true);
        setCurrent(FALLBACK);
      }
    },
  };

  if (useFill || rest.fill) {
    return (
      <Image
        {...rest}
        {...common}
        src={current}
        fill
        style={{ objectFit: "cover", ...(rest.style || {}) }}
        placeholder="empty"
      />
    );
  }

  const width = typeof rest.width === "number" ? rest.width : 800;
  const height = typeof rest.height === "number" ? rest.height : 600;

  return (
    <Image
      {...rest}
      {...common}
      src={current}
      width={width}
      height={height}
      placeholder="empty"
    />
  );
}
