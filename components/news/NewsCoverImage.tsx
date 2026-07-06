"use client";

import { useState } from "react";
import Image from "next/image";
import { NewsImageFallback } from "@/components/news/NewsImageFallback";

type NewsCoverImageProps = {
  src?: string;
  title: string;
  sport?: string;
  compact?: boolean;
};

export function NewsCoverImage({ src, title, sport, compact = false }: NewsCoverImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <NewsImageFallback sport={sport} title={title} />;
  }

  return (
    <>
      <Image
        src={src}
        alt={title}
        fill
        sizes={compact ? "88px" : "(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"}
        className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
        onError={() => setFailed(true)}
      />
      <span className="absolute inset-0 bg-gradient-to-t from-field-950/35 to-transparent" aria-hidden />
    </>
  );
}
