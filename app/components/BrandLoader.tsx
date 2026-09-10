"use client";

import { useLanguage } from "./LanguageProvider";

export function BrandLoader({ compact = false }: { compact?: boolean }) {
  const { lang } = useLanguage();
  return <div className={`brand-loader${compact ? " brand-loader--compact" : ""}`} role="status" aria-live="polite">
    <div className="brand-loader-mark" aria-hidden="true">
      <span className="brand-loader-orbit" />
      <img src="/brand/iard-symbol.png" alt="" width="100" height="104" fetchPriority="high" />
    </div>
    <div className="brand-loader-copy"><strong>I.A.R.D</strong><span>{lang === "ar" ? "الأكاديمية الدولية للدراسات والتنمية" : "International Academy for Research & Development"}</span></div>
    <div className="brand-loader-track" aria-hidden="true"><span /></div>
    <small>{lang === "ar" ? "جارٍ التحميل…" : "Loading…"}</small>
  </div>;
}
