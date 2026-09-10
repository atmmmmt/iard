import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://iard-academy.org";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type CourseRow = { slug: string; updatedAt?: string };

async function fetchCourseSlugs(): Promise<CourseRow[]> {
  try {
    const res = await fetch(`${API_BASE}/courses?limit=200`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: CourseRow[] };
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/courses`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/verify`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];
  const courses = await fetchCourseSlugs();
  const courseRoutes: MetadataRoute.Sitemap = courses.map((c) => ({
    url: `${SITE_URL}/courses/${c.slug}`,
    lastModified: c.updatedAt ? new Date(c.updatedAt) : now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  return [...staticRoutes, ...courseRoutes];
}
