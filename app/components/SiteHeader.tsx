"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages, Menu, X } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "./LanguageProvider";

export function SiteHeader() {
  const { lang, toggle } = useLanguage();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = [
    ["/", lang === "ar" ? "الرئيسية" : "Home"],
    ["/courses", lang === "ar" ? "الكورسات" : "Courses"],
    ["/verify", lang === "ar" ? "ابحث عن معلوماتك" : "Verify Certificate"],
  ];
  return <header className="site-header"><div className="container header-inner">
    <Link className="brand" href="/" aria-label={lang === "ar" ? "الأكاديمية الدولية — الرئيسية" : "I.A.R.D — Home"}>
      <img src="/brand/iard-symbol.png" width="47" height="47" alt="I.A.R.D" />
      <span><strong>I.A.R.D</strong><small>{lang === "ar" ? "الأكاديمية الدولية" : "INTERNATIONAL ACADEMY"}</small></span>
    </Link>
    <nav id="main-navigation" className={open ? "open" : ""} aria-label={lang === "ar" ? "التنقل الرئيسي" : "Main navigation"} onKeyDown={e => { if (e.key === "Escape") { setOpen(false); document.getElementById("menu-toggle")?.focus(); } }}>
      {links.map(([href, label]) => <Link href={href} key={href} aria-current={(href === "/" ? pathname === "/" : pathname.startsWith(href)) ? "page" : undefined} onClick={() => setOpen(false)}>{label}</Link>)}
    </nav>
    <div className="header-actions">
      <button className="lang-btn" onClick={toggle} aria-label={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}><Languages size={17} />{lang === "ar" ? "EN" : "عربي"}</button>
      <button id="menu-toggle" className="menu-btn" onClick={() => setOpen(v => !v)} aria-label={lang === "ar" ? (open ? "إغلاق القائمة" : "فتح القائمة") : (open ? "Close menu" : "Open menu")} aria-expanded={open} aria-controls="main-navigation">{open ? <X /> : <Menu />}</button>
    </div>
  </div></header>;
}
