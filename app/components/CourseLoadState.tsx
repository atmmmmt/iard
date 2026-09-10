"use client";

import { BrandLoader } from "./BrandLoader";
import { useLanguage } from "./LanguageProvider";

export function CourseLoadState({ loading, error, retry }: { loading: boolean; error: boolean; retry: () => void }) {
  const { lang } = useLanguage();
  if (loading) return <div className="course-load-state"><BrandLoader compact /><div className="course-skeletons" aria-hidden="true">{[0, 1, 2].map(i => <div className="course-skeleton" key={i}><div /><span /><span /></div>)}</div></div>;
  if (error) return <div className="course-empty" role="alert"><p>{lang === "ar" ? "تعذّر تحميل البرامج. حاول مرة أخرى." : "We couldn't load the programs. Please try again."}</p><button className="btn btn-primary" onClick={retry}>{lang === "ar" ? "إعادة المحاولة" : "Try again"}</button></div>;
  return <p className="course-empty">{lang === "ar" ? "لا توجد برامج مطابقة حالياً." : "No matching programs right now."}</p>;
}
