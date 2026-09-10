"use client";

import { Activity, Award, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, FolderTree, Gauge, Globe2, Image as ImageIcon, Languages, Library, LogOut, Plus, Save, Settings, ShieldCheck, Trash2, Upload, UserRound, Users, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../components/LanguageProvider";
import { apiFetch } from "../lib/api";

type Lang = "ar" | "en";
type Bi = { ar?: string; en?: string };
type Section = "overview" | "categories" | "courses" | "students" | "certificates" | "content" | "media" | "admins" | "activity" | "settings";
type List<T> = { items: T[]; pagination: { page: number; pages: number; total: number; limit?: number } };
type Category = { _id: string; name: Bi; slug: string; active: boolean; sortOrder?: number };
type Course = { _id: string; code: string; slug: string; title?: Bi; category?: Bi | string; categoryId?: string; duration?: string; instructor?: { name?: string }; status: string; imageUrl?: string; certificateSampleUrl?: string; curriculum?: Bi[] };
type Student = { _id: string; studentId: string; fullName?: Bi; email?: string; phone?: string; city?: Bi; status: string; publicProfile?: boolean };
type Cert = { _id: string; certificateNumber: string; courseTitle?: Bi; issueDate: string; status: string; optimizedImageUrl?: string };
type Audit = { _id: string; action: string; entity?: string; entityId?: string; ip?: string; createdAt: string };
type AdminUser = { _id: string; name: string; email: string; role: string; active: boolean; lastLoginAt?: string };
type SiteSettings = { academyName?: Bi; tagline?: Bi; about?: Bi; contact?: { email?: string; phone?: string; whatsapp?: string; address?: Bi }; social?: { facebook?: string; instagram?: string; linkedin?: string } };

const nav: [Section, typeof Gauge, string, string][] = [
  ["overview", Gauge, "نظرة عامة", "Overview"],
  ["categories", FolderTree, "التصنيفات", "Categories"],
  ["courses", BookOpen, "الكورسات", "Courses"],
  ["students", Users, "الطلاب", "Students"],
  ["certificates", Award, "الشهادات", "Certificates"],
  ["content", Globe2, "محتوى الموقع", "Website Content"],
  ["media", Library, "مكتبة الوسائط", "Media Library"],
  ["admins", ShieldCheck, "المدراء والصلاحيات", "Administrators"],
  ["activity", Activity, "سجل النشاط", "Activity Log"],
  ["settings", Settings, "الإعدادات", "Settings"],
];

const t = (lang: Lang, ar: string, en: string) => lang === "ar" ? ar : en;
const fmtDate = (v?: string) => v ? new Date(v).toLocaleDateString("en-GB") : "—";
const errMsg = (e: unknown) => e instanceof Error ? e.message : "Request failed";
const biValue = (value: Bi | string | undefined, lang: Lang) => typeof value === "string" ? value : value?.[lang] || value?.[lang === "ar" ? "en" : "ar"] || "—";

function useLoad<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const reload = useCallback(() => {
    apiFetch<T>(path).then(d => { setData(d); setError(""); }).catch(e => setError(errMsg(e)));
  }, [path]);
  useEffect(() => { reload(); }, [reload]);
  return { data, error, reload };
}

export default function Admin() {
  const { lang, toggle } = useLanguage();
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");
  const [toast, setToast] = useState("");
  const [me, setMe] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    let alive = true;
    apiFetch<{ user: { name: string; role: string } }>("/auth/me").then(r => { if (alive) setMe(r.user); }).catch(() => router.replace("/admin/login"));
    return () => { alive = false; };
  }, [router]);

  async function logout() {
    try { await apiFetch("/auth/logout", { method: "POST" }); } catch {}
    router.push("/admin/login");
  }

  const notify = (text: string) => { setToast(text); setTimeout(() => setToast(""), 3000); };
  if (!me) return <main className="admin-shell" />;

  return <main className="admin-shell">
    <aside className="admin-sidebar"><div className="admin-brand"><img src="/brand/iard-symbol.png" alt="" /><strong>I.A.R.D</strong></div><nav>{nav.map(([id, Icon, ar, en]) => <button className={section === id ? "active" : ""} onClick={() => setSection(id)} key={id}><Icon />{t(lang, ar, en)}</button>)}</nav><button className="logout" onClick={logout}><LogOut />{t(lang, "تسجيل الخروج", "Logout")}</button></aside>
    <section className="admin-main">
      <header className="admin-topbar"><strong>{t(lang, "لوحة الإدارة", "Admin Dashboard")}</strong><div><button onClick={toggle}><Languages /></button><UserRound /><span>{me.name}</span></div></header>
      <div className="admin-content">
        {section === "overview" && <Overview lang={lang} />}
        {section === "categories" && <Categories lang={lang} notify={notify} />}
        {section === "courses" && <Courses lang={lang} notify={notify} />}
        {section === "students" && <Students lang={lang} notify={notify} />}
        {section === "certificates" && <Certificates lang={lang} notify={notify} />}
        {section === "content" && <SettingsPanel lang={lang} notify={notify} mode="content" />}
        {section === "settings" && <SettingsPanel lang={lang} notify={notify} mode="general" />}
        {section === "media" && <Media lang={lang} />}
        {section === "admins" && <Admins lang={lang} />}
        {section === "activity" && <ActivityLog lang={lang} />}
      </div>
    </section>
    {toast && <div className="toast"><CheckCircle2 />{toast}</div>}
  </main>;
}

function Head({ title, desc, action }: { title: string; desc: string; action?: ReactNode }) { return <div className="admin-head"><div><h1>{title}</h1><p>{desc}</p></div>{action}</div>; }
function Empty({ lang, error }: { lang: Lang; error?: string }) { return <p style={{ padding: "24px", textAlign: "center" }}>{error ? `⚠ ${error}` : t(lang, "لا توجد بيانات بعد", "No data yet")}</p>; }
function Status({ value }: { value: string }) { return <span className={`status ${value === "published" || value === "active" || value === "verified" ? "active" : "draft"}`}>{value}</span>; }

function Pager({ lang, pagination, page, setPage }: { lang: Lang; pagination?: List<unknown>["pagination"]; page: number; setPage: (v: number) => void }) {
  if (!pagination || pagination.pages <= 1) return null;
  return <div className="admin-pagination"><button disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronRight /></button><span>{t(lang, `صفحة ${page} من ${pagination.pages}`, `Page ${page} of ${pagination.pages}`)}</span><button disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}><ChevronLeft /></button></div>;
}

function Overview({ lang }: { lang: Lang }) {
  const { data, error } = useLoad<{ students: number; courses: number; certificates: number; recentActivity: Audit[] }>("/admin/dashboard");
  const metrics: [typeof Users, number | string, string][] = [[Users, data?.students ?? "—", t(lang, "الطلاب النشطون", "Active students")], [BookOpen, data?.courses ?? "—", t(lang, "الكورسات المنشورة", "Published courses")], [Award, data?.certificates ?? "—", t(lang, "الشهادات الموثقة", "Verified certificates")]];
  return <><Head title={t(lang, "نظرة عامة على الأكاديمية", "Academy Overview")} desc={t(lang, "أرقام حقيقية من قاعدة البيانات", "Live figures from the database")} /><div className="metric-grid">{metrics.map(([I, n, label]) => <article className="metric" key={label}><div><span>{label}</span><strong>{n}</strong></div><I /></article>)}</div><div className="dashboard-grid"><article className="activity-card"><h3>{t(lang, "آخر النشاطات", "Recent activity")}</h3>{data?.recentActivity.length ? data.recentActivity.map(a => <div className="activity-item" key={a._id}><CheckCircle2 /><span>{a.action} — {fmtDate(a.createdAt)}</span></div>) : <Empty lang={lang} error={error} />}</article></div></>;
}

function Categories({ lang, notify }: { lang: Lang; notify: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const { data, error, reload } = useLoad<Category[]>("/admin/categories?includeInactive=1");
  async function create(form: FormData) {
    const ar = String(form.get("nameAr") || "").trim();
    const en = String(form.get("nameEn") || "").trim();
    await apiFetch("/admin/categories", { method: "POST", body: JSON.stringify({ name: { ar, en } }) });
    setOpen(false); notify(t(lang, "تمت إضافة التصنيف", "Category added")); reload();
  }
  async function archive(item: Category) {
    if (!confirm(t(lang, `تعطيل تصنيف ${item.name.ar}؟`, `Disable ${item.name.en}?`))) return;
    try { await apiFetch(`/admin/categories/${item._id}`, { method: "DELETE" }); notify(t(lang, "تم تعطيل التصنيف", "Category disabled")); reload(); } catch (e) { notify(errMsg(e)); }
  }
  return <><Head title={t(lang, "التصنيفات الرئيسية", "Course Categories")} desc={t(lang, "أنشئ التصنيفات أولاً ثم اربط كل دورة بتصنيف من القائمة", "Create categories first, then select one when adding a course")} action={<button className="btn btn-primary" onClick={() => setOpen(true)}><Plus />{t(lang, "إضافة تصنيف", "Add Category")}</button>} /><div className="category-admin-grid">{data?.length ? data.map(item => <article className={`category-admin-card${item.active ? "" : " is-disabled"}`} key={item._id}><div className="category-icon"><FolderTree /></div><div><strong>{item.name[lang]}</strong><small>{item.name[lang === "ar" ? "en" : "ar"]}</small><span>{item.slug}</span></div><div className="category-card-actions"><Status value={item.active ? "active" : "disabled"} />{item.active && <button onClick={() => archive(item)}><Trash2 /></button>}</div></article>) : <Empty lang={lang} error={error} />}</div>{open && <FormModal title={t(lang, "إضافة تصنيف رئيسي", "Add Category")} lang={lang} close={() => setOpen(false)} submit={create}><div className="form-grid"><label>{t(lang, "اسم التصنيف بالعربية", "Arabic category name")}<input name="nameAr" required placeholder="مثال: البرمجة" /></label><label>English category name<input name="nameEn" required placeholder="Programming" /></label></div></FormModal>}</>;
}

function Courses({ lang, notify }: { lang: Lang; notify: (v: string) => void }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [axes, setAxes] = useState<Bi[]>([{ ar: "", en: "" }]);
  const { data, error, reload } = useLoad<List<Course>>(`/admin/courses?limit=10&page=${page}&q=${encodeURIComponent(q)}`);
  const { data: categories } = useLoad<Category[]>("/admin/categories");
  useEffect(() => { setPage(1); }, [q]);

  function updateAxis(index: number, key: keyof Bi, value: string) { setAxes(current => current.map((axis, i) => i === index ? { ...axis, [key]: value } : axis)); }
  function splitLines(value: FormDataEntryValue | null) { return String(value || "").split(/\r?\n/).map(v => v.trim()).filter(Boolean); }

  async function create(form: FormData) {
    const title = { ar: String(form.get("titleAr") || "").trim(), en: String(form.get("titleEn") || "").trim() };
    const description = { ar: String(form.get("descriptionAr") || "").trim(), en: String(form.get("descriptionEn") || "").trim() };
    const details = { ar: String(form.get("detailsAr") || "").trim(), en: String(form.get("detailsEn") || "").trim() };
    const outcomeAr = splitLines(form.get("outcomesAr"));
    const outcomeEn = splitLines(form.get("outcomesEn"));
    const learningOutcomes = Array.from({ length: Math.max(outcomeAr.length, outcomeEn.length) }, (_, i) => ({ ar: outcomeAr[i] || "", en: outcomeEn[i] || "" })).filter(v => v.ar || v.en);
    const curriculum = axes.map(v => ({ ar: String(v.ar || "").trim(), en: String(v.en || "").trim() })).filter(v => v.ar || v.en);
    const slugBase = title.en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "course";
    const payload = { code: String(form.get("code") || ""), slug: `${slugBase}-${Date.now().toString().slice(-4)}`, title, summary: description, description, details, categoryId: String(form.get("categoryId") || ""), duration: String(form.get("duration") || ""), instructor: { name: String(form.get("instructor") || "") }, status: String(form.get("status") || "published"), curriculum, learningOutcomes };
    const body = new FormData();
    body.append("payload", JSON.stringify(payload));
    const courseImage = form.get("courseImage");
    const certificateSample = form.get("certificateSample");
    if (courseImage instanceof File && courseImage.size) body.append("courseImage", courseImage);
    if (certificateSample instanceof File && certificateSample.size) body.append("certificateSample", certificateSample);
    await apiFetch("/admin/courses", { method: "POST", body });
    setOpen(false); setAxes([{ ar: "", en: "" }]); notify(t(lang, "تمت إضافة الدورة", "Course added")); reload();
  }

  async function removeCourse(c: Course) { if (!confirm(t(lang, `حذف الدورة ${c.code} نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`, `Permanently delete ${c.code}? This cannot be undone.`))) return; try { await apiFetch(`/admin/courses/${c._id}`, { method: "DELETE" }); notify(t(lang, "تم حذف الدورة نهائياً", "Course permanently deleted")); reload(); } catch (e) { notify(errMsg(e)); } }
  async function publish(c: Course) { try { await apiFetch(`/admin/courses/${c._id}`, { method: "PATCH", body: JSON.stringify({ status: c.status === "published" ? "draft" : "published" }) }); reload(); } catch (e) { notify(errMsg(e)); } }

  return <><Head title={t(lang, "إدارة الكورسات", "Course Management")} desc={t(lang, "الصورة، التصنيف، المحاور ونموذج الشهادة تُدار من نفس الدورة", "Manage image, category, curriculum and certificate sample per course")} action={<button className="btn btn-primary" onClick={() => setOpen(true)}><Plus />{t(lang, "إنشاء دورة", "Create Course")}</button>} /><div className="table-card"><div className="table-toolbar"><input value={q} onChange={e => setQ(e.target.value)} placeholder={t(lang, "بحث بالعنوان أو الرمز...", "Search title or code...")} /></div>{data?.items.length ? <table><thead><tr><th>{t(lang, "الرمز", "Code")}</th><th>{t(lang, "الدورة", "Course")}</th><th>{t(lang, "التصنيف", "Category")}</th><th>{t(lang, "المدرب", "Instructor")}</th><th>{t(lang, "الحالة", "Status")}</th><th /></tr></thead><tbody>{data.items.map(c => <tr key={c._id}><td>{c.code}</td><td><strong>{c.title?.[lang]}</strong></td><td>{biValue(c.category, lang)}</td><td>{c.instructor?.name || "—"}</td><td><button className="link-btn" onClick={() => publish(c)}><Status value={c.status} /></button></td><td><div className="row-actions"><button onClick={() => removeCourse(c)} title={t(lang, "حذف نهائي", "Delete permanently")}><Trash2 /></button></div></td></tr>)}</tbody></table> : <Empty lang={lang} error={error} />}<Pager lang={lang} pagination={data?.pagination} page={page} setPage={setPage} /></div>

    {open && <FormModal wide title={t(lang, "إضافة دورة جديدة", "Create Course")} lang={lang} close={() => setOpen(false)} submit={create}>
      <div className="admin-form-section"><div className="admin-form-section-title"><BookOpen /><div><strong>{t(lang, "المعلومات الأساسية", "Basic information")}</strong><small>{t(lang, "بيانات الدورة التي ستظهر للزائر", "Public course information")}</small></div></div><div className="form-grid"><label>{t(lang, "عنوان الدورة بالعربية", "Arabic title")}<input name="titleAr" required /></label><label>English title<input name="titleEn" required /></label><label>{t(lang, "رمز الدورة", "Course code")}<input name="code" placeholder="IARD-101" required /></label><label>{t(lang, "التصنيف الرئيسي", "Main category")}<select name="categoryId" required defaultValue=""><option value="" disabled>{t(lang, "اختر التصنيف", "Select category")}</option>{categories?.map(category => <option value={category._id} key={category._id}>{category.name[lang]}</option>)}</select></label><label>{t(lang, "المدة", "Duration")}<input name="duration" placeholder={t(lang, "مثال: 24 ساعة", "e.g. 24 hours")} /></label><label>{t(lang, "المدرب", "Instructor")}<input name="instructor" /></label><label>{t(lang, "الحالة", "Status")}<select name="status"><option value="published">published</option><option value="draft">draft</option></select></label></div></div>

      <div className="admin-form-section"><div className="admin-form-section-title"><ImageIcon /><div><strong>{t(lang, "صور الدورة", "Course media")}</strong><small>{t(lang, "صورة الكورس ونموذج الشهادة", "Course cover and certificate sample")}</small></div></div><div className="asset-upload-grid"><label className="asset-upload"><ImageIcon /><strong>{t(lang, "صورة الكورس", "Course image")}</strong><small>JPG, PNG, WebP</small><input name="courseImage" type="file" accept="image/jpeg,image/png,image/webp" required /></label><label className="asset-upload"><Award /><strong>{t(lang, "نموذج الشهادة", "Certificate sample")}</strong><small>PNG only</small><input name="certificateSample" type="file" accept="image/png" required /></label></div></div>

      <div className="admin-form-section"><div className="admin-form-section-title"><Globe2 /><div><strong>{t(lang, "المحتوى", "Content")}</strong><small>{t(lang, "الوصف والتفاصيل ومخرجات التعلم", "Description, details and outcomes")}</small></div></div><div className="form-grid"><label>{t(lang, "الوصف العربي", "Arabic description")}<textarea name="descriptionAr" required /></label><label>English description<textarea name="descriptionEn" required /></label><label>{t(lang, "تفاصيل إضافية بالعربية", "Arabic details")}<textarea name="detailsAr" /></label><label>English details<textarea name="detailsEn" /></label><label>{t(lang, "ماذا سيتعلم؟ بالعربية — كل نقطة بسطر", "Arabic learning outcomes — one per line")}<textarea name="outcomesAr" /></label><label>English outcomes — one per line<textarea name="outcomesEn" /></label></div></div>

      <div className="admin-form-section"><div className="admin-form-section-title"><FolderTree /><div><strong>{t(lang, "محاور الدورة", "Course curriculum")}</strong><small>{t(lang, "هذه المحاور ستظهر فعلياً ضمن تبويب المحاور في صفحة الدورة", "These items appear in the Curriculum tab")}</small></div></div><div className="axis-list">{axes.map((axis, index) => <div className="axis-row" key={index}><span className="axis-number">{index + 1}</span><input value={axis.ar || ""} onChange={e => updateAxis(index, "ar", e.target.value)} placeholder={t(lang, "المحور بالعربية", "Arabic module")} /><input value={axis.en || ""} onChange={e => updateAxis(index, "en", e.target.value)} placeholder="English module" />{axes.length > 1 && <button type="button" onClick={() => setAxes(v => v.filter((_, i) => i !== index))}><X /></button>}</div>)}</div><button className="btn btn-outline add-axis" type="button" onClick={() => setAxes(v => [...v, { ar: "", en: "" }])}><Plus />{t(lang, "إضافة محور", "Add module")}</button></div>
    </FormModal>}
  </>;
}

function Students({ lang, notify }: { lang: Lang; notify: (v: string) => void }) {
  const [q, setQ] = useState(""); const [page, setPage] = useState(1); const [open, setOpen] = useState(false);
  const { data, error, reload } = useLoad<List<Student>>(`/admin/students?limit=10&page=${page}&q=${encodeURIComponent(q)}`);
  useEffect(() => { setPage(1); }, [q]);
  async function create(form: FormData) { const s = (k: string) => String(form.get(k) || ""); await apiFetch("/admin/students", { method: "POST", body: JSON.stringify({ studentId: s("studentId"), fullName: { ar: s("nameAr"), en: s("nameEn") }, email: s("email") || undefined, phone: s("phone"), city: { ar: s("cityAr"), en: s("cityEn") }, country: { ar: s("countryAr"), en: s("countryEn") }, status: "active", publicProfile: true }) }); setOpen(false); notify(t(lang, "تمت إضافة الطالب", "Student added")); reload(); }
  async function archive(st: Student) { if (!confirm(t(lang, `أرشفة الطالب ${st.studentId}؟`, `Archive ${st.studentId}?`))) return; try { await apiFetch(`/admin/students/${st._id}`, { method: "DELETE" }); reload(); } catch (e) { notify(errMsg(e)); } }
  return <><Head title={t(lang, "إدارة الطلاب", "Students Management")} desc={t(lang, "ملفات الطلاب", "Student profiles")} action={<button className="btn btn-primary" onClick={() => setOpen(true)}><Plus />{t(lang, "إضافة طالب", "Add Student")}</button>} /><div className="table-card"><div className="table-toolbar"><input value={q} onChange={e => setQ(e.target.value)} placeholder={t(lang, "ابحث بالاسم أو الرقم...", "Search name or ID...")} /></div>{data?.items.length ? <table><thead><tr><th>{t(lang, "الطالب", "Student")}</th><th>ID</th><th>Email</th><th>{t(lang, "المدينة", "City")}</th><th>{t(lang, "الحالة", "Status")}</th><th /></tr></thead><tbody>{data.items.map(st => <tr key={st._id}><td><a className="link-btn" href={`/student/${st.studentId}`} target="_blank" rel="noreferrer">{st.fullName?.[lang]}</a></td><td>{st.studentId}</td><td>{st.email || "—"}</td><td>{st.city?.[lang] || "—"}</td><td><Status value={st.status} /></td><td>{st.status !== "archived" && <button onClick={() => archive(st)}><Trash2 /></button>}</td></tr>)}</tbody></table> : <Empty lang={lang} error={error} />}<Pager lang={lang} pagination={data?.pagination} page={page} setPage={setPage} /></div>{open && <FormModal title={t(lang, "إضافة طالب", "Add Student")} lang={lang} close={() => setOpen(false)} submit={create}><div className="form-grid"><label>{t(lang, "رقم الطالب", "Student ID")}<input name="studentId" placeholder="STU-0001" required /></label><label>Email<input name="email" type="email" /></label><label>{t(lang, "الاسم بالعربية", "Arabic name")}<input name="nameAr" required /></label><label>English name<input name="nameEn" required /></label><label>{t(lang, "المدينة بالعربية", "City (AR)")}<input name="cityAr" /></label><label>City (EN)<input name="cityEn" /></label><label>{t(lang, "الدولة بالعربية", "Country (AR)")}<input name="countryAr" /></label><label>Country (EN)<input name="countryEn" /></label><label>{t(lang, "الهاتف", "Phone")}<input name="phone" /></label></div></FormModal>}</>;
}

function Certificates({ lang, notify }: { lang: Lang; notify: (v: string) => void }) {
  const [q, setQ] = useState(""); const [page, setPage] = useState(1); const [open, setOpen] = useState(false);
  const { data, error, reload } = useLoad<List<Cert>>(`/admin/certificates?limit=10&page=${page}&q=${encodeURIComponent(q)}`);
  const { data: courses } = useLoad<List<Course>>("/admin/courses?limit=50");
  useEffect(() => { setPage(1); }, [q]);
  async function create(form: FormData) { await apiFetch("/admin/certificates", { method: "POST", body: form }); setOpen(false); notify(t(lang, "تم رفع الشهادة وربطها بالدورة", "Certificate uploaded and linked to course")); reload(); }
  async function revoke(c: Cert) { if (!confirm(t(lang, `إلغاء الشهادة ${c.certificateNumber}؟`, `Revoke ${c.certificateNumber}?`))) return; try { await apiFetch(`/admin/certificates/${c._id}`, { method: "DELETE" }); reload(); } catch (e) { notify(errMsg(e)); } }
  return <><Head title={t(lang, "إدارة الشهادات", "Certificates Management")} desc={t(lang, "كل شهادة مرتبطة بطالب موجود وبكورس محدد", "Each certificate is linked to an existing student and a selected course")} action={<button className="btn btn-primary" onClick={() => setOpen(true)}><Upload />{t(lang, "رفع شهادة", "Upload Certificate")}</button>} /><div className="table-card"><div className="table-toolbar"><input value={q} onChange={e => setQ(e.target.value)} placeholder={t(lang, "بحث برقم الشهادة...", "Search certificate number...")} /></div>{data?.items.length ? <table><thead><tr><th>{t(lang, "رقم الشهادة", "Certificate ID")}</th><th>{t(lang, "الدورة", "Course")}</th><th>{t(lang, "الإصدار", "Issued")}</th><th>{t(lang, "الحالة", "Status")}</th><th /></tr></thead><tbody>{data.items.map(c => <tr key={c._id}><td><a className="link-btn" href={`/certificate/${c.certificateNumber}`} target="_blank" rel="noreferrer">{c.certificateNumber}</a></td><td>{c.courseTitle?.[lang]}</td><td>{fmtDate(c.issueDate)}</td><td><Status value={c.status} /></td><td>{c.status === "verified" && <button onClick={() => revoke(c)}><Trash2 /></button>}</td></tr>)}</tbody></table> : <Empty lang={lang} error={error} />}<Pager lang={lang} pagination={data?.pagination} page={page} setPage={setPage} /></div>
    {open && <FormModal title={t(lang, "رفع شهادة", "Upload Certificate")} lang={lang} close={() => setOpen(false)} submit={create}><label className="dropzone"><Upload /><strong>{t(lang, "اختر صورة الشهادة", "Choose certificate file")}</strong><small>JPG, PNG, WebP, PDF — Max 15MB</small><input name="certificateFile" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required /></label><div className="form-grid"><label>{t(lang, "رقم الشهادة", "Certificate ID")}<input name="certificateNumber" placeholder="IARD-2026-001" required /></label><label>{t(lang, "رقم الطالب المسجل", "Existing student ID")}<input name="studentId" placeholder="STU-0001" required /></label><label className="form-span-2">{t(lang, "الدورة", "Course")}<select name="courseId" required defaultValue=""><option value="" disabled>{t(lang, "اختر الدورة المرتبطة بالشهادة", "Select the certificate course")}</option>{courses?.items.filter(c => c.status !== "archived").map(c => <option value={c._id} key={c._id}>{c.code} — {c.title?.[lang]}</option>)}</select></label><label>{t(lang, "تاريخ الإصدار", "Issue date")}<input name="issueDate" type="date" required /></label></div><p className="form-hint">{t(lang, "لا داعي لكتابة اسم الدورة يدوياً؛ سيتم أخذه تلقائياً من الدورة المختارة. إذا كان رقم الطالب غير موجود سيظهر لك خطأ واضح يطلب إضافته أولاً.", "Course title is filled automatically from the selected course. If the student ID does not exist, a clear error will ask you to add the student first.")}</p></FormModal>}
  </>;
}

function SettingsPanel({ lang, notify, mode }: { lang: Lang; notify: (v: string) => void; mode: "general" | "content" }) {
  const { data, error } = useLoad<SiteSettings>("/admin/settings");
  async function save(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const f = new FormData(e.currentTarget); const s = (k: string) => String(f.get(k) || ""); const body: SiteSettings = mode === "content" ? { tagline: { ar: s("taglineAr"), en: s("taglineEn") }, about: { ar: s("aboutAr"), en: s("aboutEn") } } : { academyName: { ar: s("nameAr"), en: s("nameEn") }, contact: { email: s("email"), phone: s("phone"), whatsapp: s("whatsapp"), address: { ar: s("addressAr"), en: s("addressEn") } }, social: { facebook: s("facebook"), instagram: s("instagram"), linkedin: s("linkedin") } }; try { await apiFetch("/admin/settings", { method: "PUT", body: JSON.stringify({ ...data, ...body }) }); notify(t(lang, "تم الحفظ", "Saved")); } catch (err) { notify(errMsg(err)); } }
  if (!data) return <Empty lang={lang} error={error} />;
  return <form onSubmit={save}><Head title={mode === "content" ? t(lang, "إدارة محتوى الموقع", "Website Content") : t(lang, "إعدادات المنصة", "Platform Settings")} desc={t(lang, "البيانات محفوظة في قاعدة البيانات", "Stored in the database")} action={<button className="btn btn-primary"><Save />{t(lang, "حفظ التغييرات", "Save Changes")}</button>} />{mode === "content" ? <div className="settings-card"><div className="form-grid"><label>{t(lang, "الشعار بالعربية", "Tagline (AR)")}<input name="taglineAr" defaultValue={data.tagline?.ar} /></label><label>Tagline (EN)<input name="taglineEn" defaultValue={data.tagline?.en} /></label><label>{t(lang, "نبذة بالعربية", "About (AR)")}<textarea name="aboutAr" defaultValue={data.about?.ar} /></label><label>About (EN)<textarea name="aboutEn" defaultValue={data.about?.en} /></label></div></div> : <><div className="settings-card"><h3>{t(lang, "هوية الأكاديمية", "Academy Identity")}</h3><div className="form-grid"><label>{t(lang, "الاسم بالعربية", "Name (AR)")}<input name="nameAr" defaultValue={data.academyName?.ar} /></label><label>Name (EN)<input name="nameEn" defaultValue={data.academyName?.en} /></label></div></div><div className="settings-card"><h3>{t(lang, "معلومات التواصل", "Contact Information")}</h3><div className="form-grid"><label>Email<input name="email" defaultValue={data.contact?.email} /></label><label>{t(lang, "الهاتف", "Phone")}<input name="phone" defaultValue={data.contact?.phone} /></label><label>WhatsApp<input name="whatsapp" defaultValue={data.contact?.whatsapp} /></label><span /><label>{t(lang, "العنوان بالعربية", "Address (AR)")}<textarea name="addressAr" defaultValue={data.contact?.address?.ar} /></label><label>Address (EN)<textarea name="addressEn" defaultValue={data.contact?.address?.en} /></label><label>Facebook<input name="facebook" defaultValue={data.social?.facebook} /></label><label>Instagram<input name="instagram" defaultValue={data.social?.instagram} /></label><label>LinkedIn<input name="linkedin" defaultValue={data.social?.linkedin} /></label></div></div></>}</form>;
}

function Media({ lang }: { lang: Lang }) { return <><Head title={t(lang, "مكتبة الوسائط", "Media Library")} desc={t(lang, "صور الكورسات ونماذج الشهادات ترفع من صفحة الكورس، وصور شهادات الطلاب من قسم الشهادات", "Course images and samples are uploaded with courses; issued certificate files are uploaded from Certificates")} /><Empty lang={lang} /></>; }
function Admins({ lang }: { lang: Lang }) { const { data, error } = useLoad<AdminUser[]>("/admin/administrators"); return <><Head title={t(lang, "المدراء والصلاحيات", "Administrators & Roles")} desc={t(lang, "حسابات لوحة الإدارة", "Dashboard accounts")} /><div className="table-card">{data?.length ? <table><thead><tr><th>{t(lang, "الاسم", "Name")}</th><th>Email</th><th>{t(lang, "الدور", "Role")}</th><th>{t(lang, "آخر دخول", "Last login")}</th><th>Status</th></tr></thead><tbody>{data.map(a => <tr key={a._id}><td>{a.name}</td><td>{a.email}</td><td>{a.role}</td><td>{fmtDate(a.lastLoginAt)}</td><td><Status value={a.active ? "active" : "disabled"} /></td></tr>)}</tbody></table> : <Empty lang={lang} error={error} />}</div></>; }
function ActivityLog({ lang }: { lang: Lang }) { const { data, error } = useLoad<List<Audit>>("/admin/activity?limit=50"); return <><Head title={t(lang, "سجل النشاط", "Activity Log")} desc={t(lang, "جميع تغييرات لوحة الإدارة", "All administrative changes")} /><div className="table-card">{data?.items.length ? <table><thead><tr><th>{t(lang, "العملية", "Action")}</th><th>{t(lang, "العنصر", "Entity")}</th><th>IP</th><th>{t(lang, "التاريخ", "Date")}</th></tr></thead><tbody>{data.items.map(a => <tr key={a._id}><td>{a.action}</td><td>{a.entity} {a.entityId?.slice(-6)}</td><td>{a.ip || "—"}</td><td>{new Date(a.createdAt).toLocaleString("en-GB")}</td></tr>)}</tbody></table> : <Empty lang={lang} error={error} />}</div></>; }

function FormModal({ title, lang, close, submit, children, wide = false }: { title: string; lang: Lang; close: () => void; submit: (form: FormData) => Promise<void>; children: ReactNode; wide?: boolean }) {
  const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  async function send(e: FormEvent<HTMLFormElement>) { e.preventDefault(); setSaving(true); setError(""); try { await submit(new FormData(e.currentTarget)); } catch (err) { setError(errMsg(err)); } finally { setSaving(false); } }
  return <div className="modal-backdrop"><form className={`modal admin-modal${wide ? " admin-modal-wide" : ""}`} onSubmit={send}><div className="modal-head"><div><span className="modal-kicker">I.A.R.D ADMIN</span><h2>{title}</h2></div><button type="button" onClick={close}><X /></button></div>{children}{error && <div className="form-error">⚠ {error}</div>}<div className="modal-actions"><button type="button" className="btn btn-outline" onClick={close}>{t(lang, "إلغاء", "Cancel")}</button><button className="btn btn-primary" disabled={saving}><Save />{saving ? t(lang, "جاري الحفظ...", "Saving...") : t(lang, "حفظ", "Save")}</button></div></form></div>;
}
