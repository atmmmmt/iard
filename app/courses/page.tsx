"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Clock3, Search, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PublicShell } from "../components/PublicShell";
import { useLanguage } from "../components/LanguageProvider";
import { CourseLoadState } from "../components/CourseLoadState";
import { useCourses } from "../lib/useCourses";

const PAGE_SIZE = 6;

export default function Courses() {
  const { lang } = useLanguage();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [page, setPage] = useState(1);
  const { courses, loading, error, retry } = useCourses();

  const cats = useMemo(() => [...new Set(courses.map(c => c.category[lang]).filter(Boolean))], [lang, courses]);
  const activeCategory = cats.includes(cat) ? cat : "all";
  const items = useMemo(() => courses.filter(c => (activeCategory === "all" || c.category[lang] === activeCategory) && `${c.title[lang]} ${c.code}`.toLowerCase().includes(query.toLowerCase())), [courses, activeCategory, lang, query]);
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const visibleItems = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [query, activeCategory]);

  return <PublicShell>
    <section className="page-hero"><div className="container"><span className="eyebrow">I.A.R.D ACADEMY</span><h1>{lang === "ar" ? "استكشف برامجنا التدريبية" : "Explore Our Educational Programs"}</h1><p>{lang === "ar" ? "برامج عملية مصممة لتطوير المهارات وبناء مستقبل مهني أقوى." : "Practical programs designed to build stronger career paths."}</p><div className="search-row"><Search /><input aria-label={lang === "ar" ? "البحث عن كورس" : "Search courses"} value={query} onChange={e => setQuery(e.target.value)} placeholder={lang === "ar" ? "ابحث عن دورة أو رمز..." : "Search course or code..."} /></div></div></section>

    <div className="container listing-layout">
      <aside className="filters"><h3>{lang === "ar" ? "التصنيفات" : "Categories"}</h3><button className={activeCategory === "all" ? "active" : ""} onClick={() => setCat("all")}>{lang === "ar" ? "كل التصنيفات" : "All categories"}</button>{cats.map(c => <button className={activeCategory === c ? "active" : ""} key={c} onClick={() => setCat(c)}>{c}</button>)}</aside>

      <section aria-busy={loading}>
        <div className="listing-top"><div><span className="eyebrow">{lang === "ar" ? "دليل البرامج" : "PROGRAM CATALOG"}</span><strong aria-live="polite">{loading ? (lang === "ar" ? "جارٍ تحميل البرامج…" : "Loading programs…") : (lang === "ar" ? `تم العثور على ${items.length} دورات` : `${items.length} courses found`)}</strong></div>{pages > 1 && <small>{lang === "ar" ? `الصفحة ${safePage} من ${pages}` : `Page ${safePage} of ${pages}`}</small>}</div>

        {loading || error || !items.length ? <CourseLoadState loading={loading} error={error} retry={retry} /> : <>
          <div className="course-grid course-grid-modern">{visibleItems.map(c => <article className="course-card course-card-modern" key={c.slug}>
            <div className={`course-art art-${c.color}`}>
              <img className="course-photo" src={c.imageUrl || "/images/academy-syria-learning.webp"} width="1200" height="900" alt={c.title[lang]} loading="lazy" />
              <div className="course-image-overlay" />
              <span className="course-code">{c.code}</span>
              <div className="course-book-icon"><BookOpen /></div>
            </div>
            <div className="course-body">
              <span className="pill">{c.category[lang]}</span>
              <h3>{c.title[lang]}</h3>
              <p>{c.summary[lang]}</p>
              <div className="course-meta course-meta-modern"><span><Clock3 />{c.duration[lang] || (lang === "ar" ? "المدة تحدد لاحقاً" : "Duration TBA")}</span><span><UserRound />{c.trainer[lang] || (lang === "ar" ? "المدرب يحدد لاحقاً" : "Trainer TBA")}</span></div>
              <Link className="course-details-link" href={`/courses/${c.slug}`}>{lang === "ar" ? "عرض التفاصيل" : "View details"}<ArrowLeft className="direction-arrow" /></Link>
            </div>
          </article>)}</div>

          {pages > 1 && <nav className="pagination pagination-modern" aria-label={lang === "ar" ? "صفحات الدورات" : "Course pages"}>
            <button type="button" disabled={safePage === 1} onClick={() => setPage(v => Math.max(1, v - 1))} aria-label={lang === "ar" ? "السابق" : "Previous"}><ChevronRight /></button>
            {Array.from({ length: pages }, (_, i) => i + 1).map(n => <button type="button" className={safePage === n ? "active" : ""} onClick={() => setPage(n)} key={n}>{n}</button>)}
            <button type="button" disabled={safePage === pages} onClick={() => setPage(v => Math.min(pages, v + 1))} aria-label={lang === "ar" ? "التالي" : "Next"}><ChevronLeft /></button>
          </nav>}
        </>}
      </section>
    </div>
  </PublicShell>;
}
