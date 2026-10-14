// Same rule as axiosClient's API_BASE_URL — duplicated (not imported) so this
// stays dependency-free: auth.types uses it, and importing axiosClient there
// would create an import cycle through the auth store.
const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? "https://yarn-shop-be.onrender.com/api/v1" : "/api/v1");

/**
 * Turn whatever the API sends as `avatar` into a usable image URL, or
 * undefined when there is nothing to show (→ callers render initials).
 *
 * Handles: `{ url, publicId }` objects, plain strings, null/empty values,
 * the "[object Object]" string a stale cached user can carry, and relative
 * upload paths (resolved against the backend origin, not the static host).
 */
export function resolveAvatarUrl(avatar: unknown): string | undefined {
  const raw =
    avatar && typeof avatar === "object" && "url" in avatar
      ? (avatar as { url?: unknown }).url
      : avatar;
  if (typeof raw !== "string") return undefined;

  const url = raw.trim();
  if (!url || url === "[object Object]" || url === "null" || url === "undefined") return undefined;
  if (/^(https?:|data:|blob:)/i.test(url) || url.startsWith("//")) return url;

  // Relative path from the backend (e.g. "/uploads/a.png" or "uploads/a.png").
  const origin = /^https?:\/\//i.test(API_BASE_URL) ? new URL(API_BASE_URL).origin : "";
  return `${origin}/${url.replace(/^\/+/, "")}`;
}
