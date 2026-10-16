import { cn } from "../ui/utils";

const SRC = "/logo-wordmark.png";
// Intrinsic size of logo-wordmark.png — keeps the aspect ratio while loading
const WIDTH = 339;
const HEIGHT = 139;

/**
 * "len&em" wordmark image. Set the size with a height class (e.g. `h-8`);
 * width follows the aspect ratio.
 *
 * - default: the original purple/pink artwork (brightened in dark mode).
 * - `mono`: painted in `currentColor` via a CSS mask — for surfaces whose
 *   colour changes (e.g. membership cards per rank).
 *
 * Decorative by default; pass `label` when the wordmark is the only name
 * on screen and isn't already inside a labelled link.
 */
export function Wordmark({
  className,
  mono = false,
  label,
}: {
  className?: string;
  mono?: boolean;
  label?: string;
}) {
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };

  if (mono) {
    return (
      <span
        {...a11y}
        className={cn("brand-wordmark-mono", className)}
        style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
      />
    );
  }

  return (
    <img
      src={SRC}
      alt={label ?? ""}
      width={WIDTH}
      height={HEIGHT}
      className={cn("brand-wordmark w-auto", className)}
      draggable={false}
    />
  );
}
