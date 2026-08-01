import { memo } from "react";

// ============================================================
// ResponsiveImage — image with native performance attributes.
// KHÔNG thay đổi UI: giữ nguyên className/style/onError của <img> gốc.
//
// Backward compatibility:
// - srcSet/sizes CHỈ được sinh khi URL có thể resize (hiện tại: Unsplash).
//   URL từ backend (Render) không hỗ trợ resize → srcSet = undefined,
//   browser dùng src gốc như cũ → không vỡ.
// - TODO (khi backend hỗ trợ CDN/thumbnail): bổ sung srcSet từ backend
//   trả về fields { src, srcSet, sizes, placeholder } trong API response.
// ============================================================

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  /** sizes attribute — chỉ áp dụng khi srcSet tồn tại */
  sizes?: string;
  /** true = ảnh LCP (above-the-fold) → eager + fetchpriority high. Mặc định lazy. */
  priority?: boolean;
}

// Các width chuẩn cho srcSet (phù hợp grid Shop 2–3 cột)
const IMAGE_WIDTHS = [200, 400, 800, 1200];

function isResizableUrl(url: string): boolean {
  return /images\.unsplash\.com/.test(url);
}

/**
 * Sinh srcSet từ URL có param resize (Unsplash `?w=...`).
 * URL không hỗ trợ → trả undefined → <img> chỉ dùng src (backward compatible).
 */
function buildSrcSet(url: string): string | undefined {
  if (!isResizableUrl(url)) return undefined;
  try {
    const u = new URL(url);
    const baseW = Number.parseInt(u.searchParams.get("w") ?? "800", 10) || 800;
    const widths = Array.from(new Set([...IMAGE_WIDTHS, baseW])).sort((a, b) => a - b);
    return widths
      .map((w) => {
        u.searchParams.set("w", String(w));
        return `${u.toString()} ${w}w`;
      })
      .join(", ");
  } catch {
    return undefined;
  }
}

export const ResponsiveImage = memo(function ResponsiveImage({
  src,
  alt,
  className,
  style,
  onError,
  sizes = "100vw",
  priority = false,
}: ResponsiveImageProps) {
  const srcSet = buildSrcSet(src);

  return (
    <img
      src={src}
      srcSet={srcSet}
      // sizes chỉ có ý nghĩa khi có srcSet; undefined khi chưa hỗ trợ
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      className={className}
      style={style}
      // LCP image: eager + high priority. Còn lại: lazy + async (không chặn main thread)
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      // Use lowercase attribute to avoid React warning
      {...(priority ? { fetchpriority: "high" } : {})}
      onError={onError}
    />
  );
});