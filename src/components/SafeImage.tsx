"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

const FALLBACK =
  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80";

type Props = Omit<ImageProps, "src" | "alt"> & {
  src?: string | null;
  alt: string;
  useFill?: boolean;
};

function usable(src?: string | null) {
  if (!src || typeof src !== "string") return null;
  const t = src.trim();
  if (!t || t.startsWith("data:") || t.startsWith("blob:")) return null;
  if (t.startsWith("http://") || t.startsWith("https://") || t.startsWith("/"))
    return t;
  return null;
}

export default function SafeImage({
  src,
  alt,
  useFill,
  className,
  sizes = "(max-width: 768px) 100vw, 33vw",
  ...rest
}: Props) {
  const resolved = usable(src) || FALLBACK;
  const [current, setCurrent] = useState(resolved);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const next = usable(src) || FALLBACK;
    setCurrent(next);
    setFailed(false);
  }, [src]);

  const onError = () => {
    if (!failed) {
      console.error("[SafeImage] failed to load:", current);
      setFailed(true);
      setCurrent(FALLBACK);
    }
  };

  if (useFill || rest.fill) {
    return (
      <Image
        {...rest}
        alt={alt}
        className={className}
        sizes={sizes}
        quality={75}
        src={current}
        fill
        style={{ objectFit: "cover", ...(rest.style || {}) }}
        placeholder="empty"
        onError={onError}
      />
    );
  }

  const width = typeof rest.width === "number" ? rest.width : 800;
  const height = typeof rest.height === "number" ? rest.height : 600;

  return (
    <Image
      {...rest}
      alt={alt}
      className={className}
      sizes={sizes}
      quality={75}
      src={current}
      width={width}
      height={height}
      placeholder="empty"
      onError={onError}
    />
  );
}
