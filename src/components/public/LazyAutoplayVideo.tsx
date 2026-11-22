"use client";

import { useEffect, useRef } from "react";

type LazyAutoplayVideoProps = {
  src: string;
  poster?: string;
  ariaLabel: string;
  controls?: boolean;
  loop?: boolean;
  className?: string;
};

type NavigatorWithConnection = Navigator & { connection?: { saveData?: boolean } };

/**
 * 静音自动播放的视频：进入屏幕才开始加载和播放，离开屏幕暂停。
 * 首屏位置的视频行为与直接 autoPlay 相同；不在首屏时（如手机上排在下方）不会白白下载。
 * 访客开启“省流量”时不自动播放，只显示封面，可手动点播。
 */
export function LazyAutoplayVideo({ src, poster, ariaLabel, controls = false, loop = false, className }: LazyAutoplayVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const saveData = (navigator as NavigatorWithConnection).connection?.saveData === true;
    if (saveData) return;

    let userPaused = false;
    const onPause = () => {
      // 访客自己点了暂停，就不再因为滚动而自动续播
      if (!video.dataset.autoPausing) userPaused = true;
      delete video.dataset.autoPausing;
    };
    video.addEventListener("pause", onPause);

    const start = () => {
      if (userPaused) return;
      video.preload = "auto";
      video.muted = true;
      void video.play().catch(() => undefined);
    };

    if (typeof IntersectionObserver === "undefined") {
      start();
      return () => video.removeEventListener("pause", onPause);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          start();
        } else if (!entry.isIntersecting && !video.paused) {
          video.dataset.autoPausing = "1";
          video.pause();
        }
      },
      // 露出六成以上才播放（手机首屏底部只露出一角时不开始下载）；完全滑出时暂停，所以同时观察 0
      { threshold: [0, 0.6] },
    );
    observer.observe(video);
    return () => {
      observer.disconnect();
      video.removeEventListener("pause", onPause);
    };
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      poster={poster}
      muted
      playsInline
      loop={loop}
      controls={controls}
      preload="none"
      aria-label={ariaLabel}
    />
  );
}
