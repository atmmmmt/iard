"use client";

import Link from "next/link";
import { Award, CalendarDays, CheckCircle2, Clock, FileImage, MessageCircle, Share2, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { PublicShell } from "../../components/PublicShell";
import { useLanguage } from "../../components/LanguageProvider";
import { courses } from "../../data/demo";
import { DEMO_MODE, fetchCourse, type UiCourse } from "../../lib/api";
import { useRouteParam } from "../../lib/useRouteParam";

type Tab = "overview" | "curriculum" | "details";

export default function CourseDetail() {
  const { lang } = useLanguage();
  const slug = useRouteParam("slug");
  const fallback: UiCourse = { ...(courses.find(x => x.slug === slug) || courses[0]) };
  const [course, setCourse] = useState<UiCourse | null | undefined>(DEMO_MODE ? fallback : undefined);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (DEMO_MODE || !slug) return;
    let alive = true;
    fetchCourse(slug)
      .then(data => { if (alive) setCourse(data); })
      .catch(() => { if (alive) setCourse(null); });
    return () => { alive = false; };
  }, [slug]);

  if (!course) {
    return <PublicShell><section className="page-hero"><div className="container"><h1>{course === undefined ? (lang === "ar" ? "جاري تحميل الدورة..." : "Loading course...") : (lang === "ar" ? "الدورة غير موجودة" : "Course not found")}</h1></div></section></PublicShell>;
  }

  const wa = `https://wa.me/963968072490?text=${encodeURIComponent(lang === "ar" ? `مرحباً، أريد الاستفسار عن دورة ${course.title.ar} – كود الدورة: ${course.code}` : `Hello, I would like to inquire about ${course.title.en} – Course Code: ${course.code}`)}`;
  const outcomes = (course.learningOutcomes || []).filter(item => item[lang]);
  const curriculum = (course.curriculum || []).filter(item => item[lang]);

  return <PublicShell>
    <section className="detail-hero"><div className="container">
      <div className="detail-badges"><span>{course.category[lang]}</span><span>{course.code}</span></div>
      <h1>{course.title[lang]}</h1>
      <div className="detail-badges"><span><UserRound /> {course.trainer[lang] || (lang === "ar" ? "يحدد لاحقاً" : "TBA")}</span><span><Clock /> {course.duration[lang] || "—"}</span>{course.format[lang] && <span>{course.format[lang]}</span>}</div>
    </div></section>

    <div className="container detail-grid">
      <article className="content-card course-detail-card">
        <div className="tabs" role="tablist">
          <button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>{lang === "ar" ? "نظرة عامة" : "Overview"}</button>
          <button className={tab === "curriculum" ? "active" : ""} onClick={() => setTab("curriculum")}>{lang === "ar" ? "المحاور" : "Curriculum"}</button>
          <button className={tab === "details" ? "active" : ""} onClick={() => setTab("details")}>{lang === "ar" ? "التفاصيل" : "Details"}</button>
        </div>

        {tab === "overview" && <div className="tab-panel">
          <h2>{lang === "ar" ? "عن هذه الدورة" : "About this course"}</h2>
          <p>{course.description?.[lang] || course.summary[lang]}</p>
          <h2>{lang === "ar" ? "ماذا ستتعلم؟" : "What You’ll Learn"}</h2>
          {outcomes.length ? <ul className="learn-list">{outcomes.map((item, index) => <li key={`${item[lang]}-${index}`}><CheckCircle2 />{item[lang]}</li>)}</ul> : <p className="muted-empty">{lang === "ar" ? "سيتم إضافة مخرجات التعلم قريباً." : "Learning outcomes will be added soon."}</p>}
          <div className="cert-callout"><Award /><div><strong>{lang === "ar" ? "شهادة احترافية موثقة" : "Professional Verified Certificate"}</strong><p>{lang === "ar" ? "تحصل على شهادة رقمية قابلة للتحقق بعد إتمام الدورة." : "Receive a digitally verifiable certificate after completion."}</p></div></div>
        </div>}

        {tab === "curriculum" && <div className="tab-panel">
          <div className="tab-panel-heading"><div><span className="eyebrow">{lang === "ar" ? `${curriculum.length} محاور` : `${curriculum.length} modules`}</span><h2>{lang === "ar" ? "محاور الدورة" : "Course Curriculum"}</h2></div></div>
          {curriculum.length ? <div className="curriculum-list">{curriculum.map((item, index) => <div className="curriculum-item" key={`${item[lang]}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item[lang]}</strong></div>)}</div> : <p className="muted-empty">{lang === "ar" ? "لم تتم إضافة محاور لهذه الدورة بعد." : "No curriculum has been added yet."}</p>}
        </div>}

        {tab === "details" && <div className="tab-panel">
          <h2>{lang === "ar" ? "تفاصيل البرنامج" : "Program Details"}</h2>
          <p>{course.details?.[lang] || (lang === "ar" ? "يمكنك التواصل معنا للحصول على مواعيد وتفاصيل التسجيل." : "Contact us for schedule and enrollment details.")}</p>
          <div className="detail-facts-grid"><div><Clock /><span>{lang === "ar" ? "المدة" : "Duration"}<strong>{course.duration[lang] || "—"}</strong></span></div><div><UserRound /><span>{lang === "ar" ? "المدرب" : "Trainer"}<strong>{course.trainer[lang] || "—"}</strong></span></div></div>
        </div>}
      </article>

      <aside><div className="sticky-card">
        <div className="listing-top"><span className="verified">{lang === "ar" ? "التسجيل متاح" : "ENROLLMENT OPEN"}</span><Share2 /></div>
        <h3>{lang === "ar" ? "سجّل في البرنامج" : "Enroll in this program"}</h3>
        <div className="facts"><div><CalendarDays /><span>{lang === "ar" ? "بداية المجموعة" : "Next cohort"}<strong>{lang === "ar" ? "يحدد بعد التواصل" : "Set after contact"}</strong></span></div><div><Clock /><span>{lang === "ar" ? "المدة" : "Duration"}<strong>{course.duration[lang] || "—"}</strong></span></div><div><UserRound /><span>{lang === "ar" ? "المدرب" : "Trainer"}<strong>{course.trainer[lang] || "—"}</strong></span></div></div>
        <a className="btn btn-whatsapp" href={wa} target="_blank" rel="noreferrer"><MessageCircle />{lang === "ar" ? "استفسر عبر واتساب" : "Inquire via WhatsApp"}</a>
        {course.certificateSampleUrl ? <a className="btn btn-outline" href={course.certificateSampleUrl} target="_blank" rel="noreferrer"><FileImage />{lang === "ar" ? "عرض نموذج الشهادة" : "View certificate sample"}</a> : <span className="btn btn-outline btn-disabled"><FileImage />{lang === "ar" ? "نموذج الشهادة غير مرفوع" : "Certificate sample unavailable"}</span>}
        <Link className="course-back-link" href="/courses">{lang === "ar" ? "العودة إلى الدورات" : "Back to courses"}</Link>
      </div></aside>
    </div>
  </PublicShell>;
}
