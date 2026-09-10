"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PublicShell } from "../components/PublicShell";
import { useLanguage } from "../components/LanguageProvider";
import { CourseLoadState } from "../components/CourseLoadState";
import { useCourses } from "../lib/useCourses";

export default function Courses() {
  const { lang } = useLanguage();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const { courses, loading, error, retry } = useCourses();
  const cats = useMemo(() => [...new Set(courses.map(c => c.category[lang]).filter(Boolean))], [lang, courses]);
  const activeCategory = cats.includes(cat) ? cat : "all";
  const items = courses.filter(c => (activeCategory === "all" || c.category[lang] === activeCategory) && `${c.title[lang]} ${c.code}`.toLowerCase().includes(query.toLowerCase()));
  return <PublicShell>
    <section className="page-hero"><div className="container"><span className="eyebrow">I.A.R.D ACADEMY</span><h1>{lang === "ar" ? "استكشف برامجنا التدريبية" : "Explore Our Educational Programs"}</h1><p>{lang === "ar" ? "برامج عملية مصممة لتطوير المهارات وبناء مستقبل مهني أقوى." : "Practical programs designed to build stronger career paths."}</p><div className="search-row"><Search /><input aria-label={lang === "ar" ? "البحث عن كورس" : "Search courses"} value={query} onChange={e => setQuery(e.target.value)} placeholder={lang === "ar" ? "ابحث عن دورة أو رمز..." : "Search course or code..."} /></div></div></section>
    <div className="container listing-layout"><aside className="filters"><h3>{lang === "ar" ? "التصنيفات" : "Categories"}</h3><button className={activeCategory === "all" ? "active" : ""} onClick={() => setCat("all")}>{lang === "ar" ? "كل التصنيفات" : "All categories"}</button>{cats.map(c => <button className={activeCategory === c ? "active" : ""} key={c} onClick={() => setCat(c)}>{c}</button>)}</aside>
      <section aria-busy={loading}><div className="listing-top"><strong aria-live="polite">{loading ? (lang === "ar" ? "جارٍ تحميل البرامج…" : "Loading programs…") : (lang === "ar" ? `تم العثور على ${items.length} دورات` : `${items.length} courses found`)}</strong></div>
        {loading || error || !items.length ? <CourseLoadState loading={loading} error={error} retry={retry} /> : <div className="course-grid">{items.map(c => <article className="course-card" key={c.slug}><div className={`course-art art-${c.color}`}><img className="course-photo" src={c.imageUrl || "/images/academy-syria-learning.webp"} width="1200" height="900" alt="" loading="lazy" /><span>{c.code}</span><BookOpen /></div><div className="course-body"><span className="pill">{c.category[lang]}</span><h3>{c.title[lang]}</h3><p>{c.summary[lang]}</p><div className="course-meta"><span>{c.duration[lang]}</span><span>{c.format[lang]}</span></div><Link href={`/courses/${c.slug}`}>{lang === "ar" ? "عرض التفاصيل" : "View details"}<ArrowLeft className="direction-arrow" /></Link></div></article>)}</div>}
      </section>
    </div>
  </PublicShell>;
}
