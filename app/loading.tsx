"use client";
import { usePathname } from "next/navigation";
import { BrandLoader } from "./components/BrandLoader";
import { isPrimaryPage } from "./lib/primaryPages";

export default function Loading() {
  const pathname = usePathname();
  return isPrimaryPage(pathname) ? <main className="page-loading"><BrandLoader /></main> : null;
}
