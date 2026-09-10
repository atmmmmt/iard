export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(payload?.message || "Request failed", response.status);
  return payload as T;
}

export function apiAsset(value?: string | null) {
  if (!value || /^https?:\/\//i.test(value)) return value || "";
  return new URL(value, API_BASE).toString();
}

export type Localized = { ar: string; en: string };
export type ApiCourse = {
  _id?: string;
  slug: string;
  code: string;
  category?: string | Partial<Localized>;
  categoryId?: string;
  title?: Localized;
  summary?: Localized;
  description?: Localized;
  duration?: string;
  format?: Localized;
  details?: Localized;
  instructor?: { name?: string; title?: string };
  curriculum?: Localized[];
  learningOutcomes?: Localized[];
  imageUrl?: string;
  certificateSampleUrl?: string;
  status?: string;
};

export type UiCourse = {
  slug: string;
  code: string;
  color: string;
  category: Localized;
  title: Localized;
  summary: Localized;
  duration: Localized;
  format: Localized;
  trainer: Localized;
  description?: Localized;
  details?: Localized;
  curriculum?: Localized[];
  learningOutcomes?: Localized[];
  imageUrl?: string;
  certificateSampleUrl?: string;
};

const COURSE_ART = ["blue", "cyan", "navy", "teal", "orange", "purple"];
const bilingual = (value?: Partial<Localized> | string): Localized => typeof value === "string"
  ? { ar: value, en: value }
  : { ar: value?.ar || value?.en || "", en: value?.en || value?.ar || "" };

export function mapCourse(c: ApiCourse, i: number): UiCourse {
  return {
    slug: c.slug,
    code: c.code,
    color: COURSE_ART[i % COURSE_ART.length],
    category: bilingual(c.category),
    title: bilingual(c.title),
    summary: bilingual(c.summary),
    description: bilingual(c.description || c.summary),
    duration: bilingual(c.duration),
    format: bilingual(c.format),
    trainer: bilingual(c.instructor?.name),
    details: bilingual(c.details),
    curriculum: (c.curriculum || []).map(bilingual),
    learningOutcomes: (c.learningOutcomes || []).map(bilingual),
    imageUrl: apiAsset(c.imageUrl),
    certificateSampleUrl: apiAsset(c.certificateSampleUrl),
  };
}

export async function fetchCourses(): Promise<UiCourse[]> {
  const data = await apiFetch<{ items: ApiCourse[] }>("/courses?limit=100");
  return (data.items || []).map(mapCourse);
}

export async function fetchCourse(slug: string): Promise<UiCourse> {
  const c = await apiFetch<ApiCourse>(`/courses/${encodeURIComponent(slug)}`);
  return mapCourse(c, 0);
}
