"use client";

import { useEffect, useRef } from "react";

export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const text = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = text.current;
    if (!element || !window.IntersectionObserver) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;
    let frame = 0;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const progress = motion.matches ? 1 : Math.min((now - start) / 1100, 1);
        element.textContent = `${Math.round(value * (1 - (1 - progress) ** 3))}${suffix}`;
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    observer.observe(element);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [value, suffix]);
  return <strong className="stat-number" aria-label={`${value}${suffix}`}><span ref={text} aria-hidden="true" dir="ltr">{value}{suffix}</span></strong>;
}
