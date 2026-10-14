import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "../ui/utils";
import "../../../styles/nav.css";

/* Focus ring dùng chung cho các phần tử tương tác tuỳ biến (không phải <Button>) */
export const focusRingClass =
  "outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";

/* ── Stagger cho danh sách link trong mobile drawer ── */
export const drawerListVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
};
export const drawerItemVariants = {
  hidden: { opacity: 0, x: 20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ── Brand / Logo — mark đọc như một cuộn chỉ: vòng chỉ đứt quay nhẹ khi hover ── */
export function Brand({
  tagline,
  compact = false,
  markOnly = false,
  className,
}: {
  tagline?: string;
  compact?: boolean;
  /** Only the yarn mark, no wordmark — used by the condensed desktop pill. */
  markOnly?: boolean;
  className?: string;
}) {
  return (
    <Link
      to="/"
      aria-label="Len&em"
      className={cn(
        "group relative flex shrink-0 items-center gap-3 rounded-2xl",
        focusRingClass,
        className,
      )}
    >
      <div
        className={cn(
          "relative flex items-center justify-center",
          compact ? "size-10" : "size-11",
        )}
      >
        <span
          aria-hidden="true"
          className="absolute inset-[-4px] rounded-full border border-dashed border-[var(--primary)] opacity-35 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-[60deg]"
        />
        <div className="relative flex size-full items-center justify-center rounded-[14px] bg-[image:var(--cta-gradient)] shadow-[var(--cta-shadow)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-rotate-6 group-active:scale-95">
          <img
            src="/yarn-shop-2-removebg-preview.vng.svg"
            alt=""
            width={32}
            height={32}
            className={cn("object-contain", compact ? "size-8" : "size-9")}
            draggable={false}
          />
        </div>
      </div>
      <div className={cn("flex flex-col leading-none", markOnly && "sr-only")}>
        <span className="nav-brand-name">
          Len<span>&</span>em
        </span>
        {tagline && !compact && (
          <span className="nav-brand-tagline hidden lg:inline-block">
            {tagline}
          </span>
        )}
      </div>
    </Link>
  );
}

/* ── Nút CTA "Start" ── */
export function ShimmerCTA({
  onClick,
  full = false,
}: {
  onClick: () => void;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "nav-btn-primary group",
        focusRingClass,
        full && "w-full py-3",
      )}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
      <span className="relative">Start</span>
      <ArrowRight className="relative size-4 transition-transform duration-200 group-hover:translate-x-1" />
    </button>
  );
}

/* ── Badge số — nền đỏ chữ trắng ── */
export function Counter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={String(children)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
        className={cn(
          "absolute -right-0.5 -top-0.5 z-10 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--destructive)] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[var(--background)]",
          className,
        )}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}
