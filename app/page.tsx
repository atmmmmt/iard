"use client";

import Link from "next/link";
import { ArrowDown, ArrowLeft, Award, BookOpen, Building2, CheckCircle2, MapPin, Search, Users } from "lucide-react";
import { PublicShell } from "./components/PublicShell";
import { useLanguage } from "./components/LanguageProvider";
import { CourseLoadState } from "./components/CourseLoadState";
import { CountUp } from "./components/CountUp";
import { useCourses } from "./lib/useCourses";

export default function Home() {
  const { lang } = useLanguage();
  const { courses, loading, error, retry } = useCourses();
  const ar = lang === "ar";
  const stats = [
    { icon: BookOpen, value: 150, suffix: "+", label: ar ? "برنامج تدريبي" : "Courses" },
    { icon: Users, value: 25, suffix: "K+", label: ar ? "خريج حول العالم" : "Alumni" },
    { icon: Building2, value: 12, suffix: "", label: ar ? "شريك أكاديمي" : "Partners" },
    { icon: Award, value: 98, suffix: "%", label: ar ? "رضا المتدربين" : "Satisfaction" },
  ];

  return <PublicShell>
    <section className="home-hero">
      <div className="container hero-layout">
      <div className="hero-copy">
        <span className="eyebrow hero-reveal">{ar ? "تعلّم وتطوّر · حلب، سوريا" : "LEARN & GROW · ALEPPO, SYRIA"}</span>
        <h1 className="hero-reveal">{ar ? <>تعلّم مهارات اليوم<br />وابنِ <em>مستقبلك</em></> : <>Learn new skills.<br />Build your <em>future.</em></>}</h1>
        <p className="hero-reveal">{ar ? "كورسات وتدريب عملي يساعدانك على تطوير مهاراتك، من أساسيات الحاسوب إلى مهارات العمل، مع فريق الأكاديمية في حلب." : "Practical courses to develop your skills, from computer essentials to workplace skills, with our academy team in Aleppo."}</p>
        <div className="hero-actions hero-reveal">
          <Link className="btn btn-primary" href="/courses"><BookOpen />{ar ? "تصفح الكورسات" : "Browse Courses"}<ArrowLeft className="direction-arrow" /></Link>
          <Link className="btn btn-glass" href="/verify"><Search />{ar ? "تحقق من شهادة" : "Verify Certificate"}</Link>
        </div>
        <div className="hero-footnote hero-reveal"><span><span className="hero-rule" />{ar ? "معرفة تُلهم. مهارات تصنع الفرق." : "Knowledge that inspires. Skills that matter."}</span><a href="#programs" className="scroll-cue" aria-label={ar ? "استكشف البرامج" : "Explore programs"}><ArrowDown size={18} /></a></div>
      </div>
      <div className="hero-visual hero-reveal"><picture className="hero-image"><source media="(max-width: 640px)" srcSet="/images/academy-syria-hero-mobile.webp" /><img src="/images/academy-syria-hero.webp" width="1448" height="1086" alt={ar ? "مشهد تعليمي توضيحي لدورة حاسوب في قاعة تدريب معاصرة" : "Illustrative computer course in a contemporary training classroom"} fetchPriority="high" /></picture><div className="hero-image-caption"><BookOpen size={20} /><span>{ar ? "نتعلّم معاً، ونطبّق خطوة بخطوة" : "Learn together. Put every lesson into practice."}</span></div></div>
      </div>
    </section>

    <section className="stats"><div className="container stats-grid">{stats.map(({ icon: Icon, value, suffix, label }) => <article key={label}><span className="stat-icon"><Icon /></span><CountUp value={value} suffix={suffix} /><small>{label}</small></article>)}</div></section>

    <section className="section" id="programs"><div className="container">
      <div className="section-head"><div><span className="eyebrow">{ar ? "برامج مختارة" : "Featured Selection"}</span><h2>{ar ? "استكشف برامجنا المهنية المتميزة" : "Explore Our Professional Programs"}</h2></div><Link href="/courses">{ar ? "عرض كل الكورسات" : "View all courses"}<ArrowLeft className="direction-arrow" /></Link></div>
      {loading || error || !courses.length ? <CourseLoadState loading={loading} error={error} retry={retry} /> : <div className="course-grid">{courses.slice(0, 3).map(c => <article className="course-card" key={c.slug}>
        <div className={`course-art art-${c.color}`}><img className="course-photo" src={c.imageUrl || "/images/academy-syria-learning.webp"} width="1200" height="900" alt="" loading="lazy" /><span>{c.code}</span><BookOpen /></div>
        <div className="course-body"><span className="pill">{c.category[lang]}</span><h3>{c.title[lang]}</h3><p>{c.summary[lang]}</p><Link href={`/courses/${c.slug}`}>{ar ? "التفاصيل" : "Details"}<ArrowLeft className="direction-arrow" /></Link></div>
      </article>)}</div>}
    </div></section>

    <section className="journey"><div className="container journey-grid">
      <div className="journey-visual"><img className="journey-photo" src="/images/academy-syria-learning.webp" width="1200" height="900" alt={ar ? "مشهد تعبيري للتعلّم التعاوني وتطوير المهارات" : "Illustrative scene of collaborative learning and skill development"} loading="lazy" /><div className="journey-caption"><span className="journey-caption-icon"><BookOpen /></span><div><small>{ar ? "من المعرفة إلى الممارسة" : "FROM KNOWLEDGE TO PRACTICE"}</small><strong>{ar ? "كل خطوة، فرصة جديدة" : "Every step, a new opportunity"}</strong></div></div><span className="visual-index" aria-hidden="true">I.A.R.D / LEARNING</span></div>
      <div className="journey-copy"><span className="eyebrow">{ar ? "رحلتك تبدأ هنا" : "Your Journey"}</span><h2>{ar ? "رحلتك نحو النجاح تبدأ من هنا" : "Your Journey to Success"}</h2>
        {[ar ? "استكشف البرامج المناسبة" : "Explore the right programs", ar ? "تواصل وسجّل بسرعة" : "Register in minutes", ar ? "تعلّم واحصل على شهادة موثقة" : "Learn and get verified"].map((title, i) => <div className="step" key={title}><b>{String(i + 1).padStart(2, "0")}</b><div><strong>{title}</strong><p>{ar ? "خطوات واضحة ودعم كامل من فريق الأكاديمية." : "Clear steps with support from our academy team."}</p></div></div>)}
        <Link className="btn btn-primary" href="/courses">{ar ? "ابدأ الآن" : "Start now"}<ArrowLeft className="direction-arrow" /></Link>
      </div>
    </div></section>

    <section className="section"><div className="container"><div className="center-heading"><span className="eyebrow">{ar ? "قريبون منك" : "CLOSE TO YOU"}</span><h2>{ar ? "تواجدنا المحلي" : "Our Local Presence"}</h2><p>{ar ? "نلتقي بكم في مركزنا التدريبي في حلب" : "Visit our training center in Aleppo"}</p></div><div className="location-card"><div><span className="eyebrow"><MapPin /> ALEPPO BRANCH</span><h2>{ar ? "حلب، سوريا" : "Aleppo, Syria"}</h2><p>{ar ? "مركز متكامل للتدريب والتطوير، يقدم دورات حضورية وورشات تفاعلية." : "A complete training and development hub for in-person courses and workshops."}</p>{[ar ? "مدربون مختصون" : "Specialist trainers", ar ? "ورشات تفاعلية" : "Interactive workshops", ar ? "دعم كامل للطلاب" : "Full student support"].map(item => <span className="check" key={item}><CheckCircle2 />{item}</span>)}</div><div className="location-brand-panel"><img src="/brand/iard-logo.png" width="320" height="240" alt="I.A.R.D Academy" loading="lazy" /><span><MapPin size={18} />{ar ? "حلب · سوريا" : "Aleppo · Syria"}</span></div></div></div></section>

    <section className="verify-strip"><img className="verify-strip-photo" src="/images/academy-syria-hero.webp" width="1920" height="1080" alt="" loading="lazy" /><div className="container"><div><h2>{ar ? "جاهز للتحقق من إنجازك؟" : "Ready to verify your achievement?"}</h2><p>{ar ? "أدخل رقمك واستعرض سجلك الأكاديمي" : "Retrieve your verified academic record"}</p></div><Link className="btn btn-light" href="/verify">{ar ? "ابدأ التحقق" : "Verify now"}<Search /></Link></div></section>
  </PublicShell>;
}

