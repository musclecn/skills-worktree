"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type HeroCarouselProps = {
  images: string[];
  alt: string;
  intervalMs?: number;
};

export function HeroCarousel({ images, alt, intervalMs = 3500 }: HeroCarouselProps) {
  const safeImages = images.filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (safeImages.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % safeImages.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [safeImages.length, intervalMs]);

  // 图片数量变少时直接按第 1 张显示，不在 effect 里回写状态
  const currentIndex = activeIndex < safeImages.length ? activeIndex : 0;

  if (safeImages.length === 0) return null;

  return (
    <div className={`hero-visual-carousel${safeImages.length <= 1 ? " single" : ""}`}>
      {safeImages.map((src, index) => (
        <div className={`hero-visual-slide${index === currentIndex ? " active" : ""}`} key={`${src}-${index}`}>
          <Image src={src} alt={`${alt} ${index + 1}`} fill sizes="(max-width: 980px) 100vw, 50vw" priority={index === 0} />
        </div>
      ))}
    </div>
  );
}
