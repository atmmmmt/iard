"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BrandLoader } from "./BrandLoader";
import { isPrimaryPage } from "../lib/primaryPages";

/** Persistent across routes, with a bounded introduction and real navigation feedback. */
export function SiteExperience() {
  const pathname = usePathname();
  const [intro, setIntro] = useState(true);
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let frame = 0;
    let delay: ReturnType<typeof setTimeout>;
    const started = performance.now();
    const finish = () => {
      const minimum = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650;
      clearTimeout(delay);
      delay = setTimeout(() => { if (alive) setIntro(false); }, Math.max(0, minimum - (performance.now() - started)));
    };
    // An unavailable image or font must never block access to the site.
    const safety = setTimeout(finish, 2200);
    const ready = () => { frame = requestAnimationFrame(finish); };
    if (document.readyState === "complete") ready();
    else window.addEventListener("load", ready, { once: true });
    return () => { alive = false; clearTimeout(safety); clearTimeout(delay); cancelAnimationFrame(frame); window.removeEventListener("load", ready); };
  }, []);

  useEffect(() => {
    let safety: ReturnType<typeof setTimeout>;
    const reset = requestAnimationFrame(() => setPendingFrom(null));
    const navigate = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname || !isPrimaryPage(url.pathname)) return;
      setPendingFrom(pathname);
      clearTimeout(safety);
      safety = setTimeout(() => setPendingFrom(null), 8000);
    };
    document.addEventListener("click", navigate, true);
    return () => { document.removeEventListener("click", navigate, true); clearTimeout(safety); cancelAnimationFrame(reset); };
  }, [pathname]);

  const pending = pendingFrom === pathname;
  return <>
    {isPrimaryPage(pathname) && <div className={`site-intro${intro ? "" : " site-intro--done"}`} aria-hidden={!intro}><BrandLoader /></div>}
    {!intro && pending && <div className="route-loading"><BrandLoader compact /></div>}
  </>;
}
