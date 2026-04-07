/**
 * Returns an absolute URL for an API path.
 *
 * - In the browser on GitHub Pages: uses NEXT_PUBLIC_API_URL (the Vercel deployment)
 * - In the browser on Vercel (or local dev): uses a relative path
 * - NEXT_PUBLIC_API_URL should be set to "https://your-app.vercel.app" for the
 *   GitHub Pages static build via GitHub Actions.
 */
export function apiUrl(path: string): string {
  const base =
    typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_API_URL ?? "")
      : "";
  return `${base}${path}`;
}
