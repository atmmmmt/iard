export function isPrimaryPage(pathname: string | null) {
  const path = (pathname || "").replace(/\/+$/, "") || "/";
  return ["/", "/courses", "/verify"].includes(path);
}
