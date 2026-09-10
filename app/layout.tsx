import type { Metadata } from "next";
import "@fontsource/tajawal/400.css";
import "@fontsource/tajawal/500.css";
import "@fontsource/tajawal/700.css";
import "@fontsource/tajawal/800.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./globals.css";
import "./experience.css";
import "./enhancements.css";
import { LanguageProvider } from "./components/LanguageProvider";
import { SiteExperience } from "./components/SiteExperience";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://iard-academy.org";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "I.A.R.D Academy — الأكاديمية الدولية للدراسات والتنمية", template: "%s | I.A.R.D Academy" },
  description: "الأكاديمية الدولية للدراسات والتنمية — كورسات احترافية وشهادات موثقة قابلة للتحقق. Professional training and verifiable certificates.",
  applicationName: "I.A.R.D Academy Portal",
  keywords: ["I.A.R.D", "الأكاديمية الدولية للدراسات والتنمية", "كورسات", "شهادات موثقة", "تدريب", "حلب", "academy", "courses", "certificate verification"],
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "I.A.R.D Academy", title: "I.A.R.D Academy — الأكاديمية الدولية للدراسات والتنمية", description: "كورسات احترافية وشهادات موثقة قابلة للتحقق.", url: SITE_URL, locale: "ar_SY", images: [{ url: "/brand/iard-logo.png", width: 1200, height: 630, alt: "I.A.R.D Academy" }] },
  twitter: { card: "summary_large_image", title: "I.A.R.D Academy", description: "كورسات احترافية وشهادات موثقة قابلة للتحقق." },
  icons: { icon: "/favicon.svg" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body><LanguageProvider><SiteExperience />{children}</LanguageProvider><noscript><style>{".site-intro{display:none!important}"}</style></noscript></body></html>;
}
