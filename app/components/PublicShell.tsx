"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function PublicShell({ children }: { children: ReactNode }) {
  const main = useRef<HTMLElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    const root = main.current;
    if (!root || !window.IntersectionObserver) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).dataset.reveal = "visible";
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -20px 0px" });
    const scan = () => {
      root.querySelectorAll<HTMLElement>(".section-head, .center-heading, .course-card, .journey-visual, .journey-copy, .step, .location-card, .trust-grid article, .content-card, .cert-card, .side-card, .certificate-record").forEach(element => {
        if (element.dataset.reveal) return;
        // With JS off everything stays visible. Visible content never flashes out.
        if (motion.matches || element.getBoundingClientRect().top < window.innerHeight - 25) element.dataset.reveal = "visible";
        else { element.dataset.reveal = "pending"; observer.observe(element); }
      });
    };
    const showAll = () => { if (motion.matches) root.querySelectorAll<HTMLElement>("[data-reveal]").forEach(element => { element.dataset.reveal = "visible"; }); };
    scan();
    const changes = new MutationObserver(scan);
    changes.observe(root, { childList: true, subtree: true });
    motion.addEventListener("change", showAll);
    return () => { observer.disconnect(); changes.disconnect(); motion.removeEventListener("change", showAll); };
  }, [pathname]);
  return <><SiteHeader /><main className="public-main" key={pathname} ref={main}>{children}</main><SiteFooter /></>;
}
