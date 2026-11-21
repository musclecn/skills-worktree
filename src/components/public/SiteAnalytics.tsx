"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { stripLocalePrefix, type SiteEventType } from "@/lib/analytics";
import { flushEvents, rememberEntry, trackEvent, trackPageView } from "@/lib/analytics-client";

const CLICK_TYPES = new Set<string>(["entry_click", "cta_click", "source_click", "lang_switch"]);
const IMPRESSION_MS = 1000;

function linkTarget(anchor: HTMLAnchorElement | null) {
  if (!anchor?.href) return null;
  try {
    const url = new URL(anchor.href, window.location.href);
    // 站外链接只记域名，不记完整地址。
    return url.host === window.location.host ? url.pathname : url.host;
  } catch {
    return null;
  }
}

/**
 * 全站访问统计：页面曝光、带 data-track 的点击、带 data-track-impression 的曝光。
 * 不渲染任何内容。
 */
export function SiteAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    trackPageView(pathname);

    // 曝光：元素至少一半进入视口并停留 1 秒，同一会话只计一次。
    const timers = new Map<Element, number>();
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                const element = entry.target as HTMLElement;
                if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                  if (timers.has(element)) continue;
                  timers.set(
                    element,
                    window.setTimeout(() => {
                      timers.delete(element);
                      const type = (element.dataset.trackImpression || "entry_impression") as SiteEventType;
                      const entryId = element.dataset.trackId || null;
                      trackEvent(
                        { type, entryId, target: element.dataset.trackTarget || null },
                        `${type}:${pathname}:${entryId ?? ""}`,
                      );
                      observer?.unobserve(element);
                    }, IMPRESSION_MS),
                  );
                } else {
                  const timer = timers.get(element);
                  if (timer) {
                    window.clearTimeout(timer);
                    timers.delete(element);
                  }
                }
              }
            },
            { threshold: [0.5] },
          );
    if (observer) {
      document.querySelectorAll<HTMLElement>("[data-track-impression]").forEach((element) => observer.observe(element));
    }

    return () => {
      observer?.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const origin = event.target instanceof Element ? event.target : null;
      if (!origin) return;

      const tracked = origin.closest<HTMLElement>("[data-track]");
      const anchor = origin.closest<HTMLAnchorElement>("a[href]");
      const target = linkTarget(anchor);

      if (tracked && CLICK_TYPES.has(tracked.dataset.track ?? "")) {
        const type = tracked.dataset.track as SiteEventType;
        const entryId = tracked.dataset.trackId || null;
        if (type === "cta_click" && entryId) rememberEntry(entryId);
        trackEvent({ type, entryId, target });
        return;
      }

      // 未显式标记、但指向联系页的链接（如导航“联系我们”）同样算预约入口点击。
      if (target && stripLocalePrefix(target) === "/contact") {
        const entryId = anchor?.closest("header") ? "nav-contact" : anchor?.closest("footer") ? "footer-contact" : "inline-contact";
        rememberEntry(entryId);
        trackEvent({ type: "cta_click", entryId, target });
      }
    }

    function onHide() {
      if (document.visibilityState === "hidden") flushEvents();
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flushEvents);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flushEvents);
    };
  }, []);

  return null;
}
