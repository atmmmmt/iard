"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

// Static export prerenders dynamic routes once with the "_" placeholder and
// .htaccess serves that page for every real value, so read the real segment
// from the browser URL instead of trusting the prerendered params.
export function useRouteParam(name: string, fallback = ""): string {
  const params = useParams();
  const fromParams = params?.[name] ? decodeURIComponent(String(params[name])) : "";
  const [value, setValue] = useState(fromParams && fromParams !== "_" ? fromParams : fallback);
  useEffect(() => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const last = parts.length > 1 ? decodeURIComponent(parts[parts.length - 1]) : "";
    if (last && last !== "_") setValue(last);
  }, []);
  return value;
}
