import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "../ui/utils";

/* ── Shared "glass chip" treatment for icon-only buttons in the desktop bar ──
   Nền hơi trong suốt (70%) để hoà vào lớp kính của header thay vì trông như
   một khối trắng đặc dán chồng lên trên — tránh cảm giác "2 lớp nền" thừa. */
export const iconChipClass =
  "relative flex items-center justify-center rounded-full min-h-[42px] min-w-[42px] border border-[var(--chip-border)] bg-[color-mix(in_srgb,var(--chip-bg)_70%,transparent)] text-[var(--foreground-muted)] outline-none transition-colors hover:text-[var(--primary)] hover:bg-[var(--chip-hover-bg)] hover:border-[var(--primary)]/40 focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";

/* Focus ring dùng chung cho các phần tử tương tác tuỳ biến (không phải <Button>) */
export const focusRingClass =
  "outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";

/* ── Stagger cho danh sách link trong mobile drawer ── */
export const drawerListVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.1 } },
};
export const drawerItemVariants = {
  hidden: { opacity: 0, x: 24 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ── Brand / Logo — mark đọc như một cuộn chỉ: vòng chỉ đứt nới lỏng khi hover ── */
export function Brand({
  tagline,
  className,
}: {
  tagline?: string;
  className?: string;
}) {
  return (
    <Link
      to="/"
      className={cn(
        "group relative flex items-center gap-3 rounded-2xl",
        focusRingClass,
        className,
      )}
    >
      <div className="relative flex size-11 items-center justify-center">
        <motion.span
          aria-hidden="true"
          className="absolute inset-[-5px] rounded-full border border-dashed"
          style={{ borderColor: "var(--primary)", opacity: 0.35 }}
          initial={{ rotate: 0 }}
          whileHover={{ rotate: 50 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          whileHover={{ rotate: -6, scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="relative flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] text-lg font-bold text-white shadow-[0_8px_24px_rgba(107,63,160,0.25)]"
        >
          L
          <motion.span
            initial={{ opacity: 0, scale: 0 }}
            whileHover={{ opacity: 1, scale: 1 }}
            className="pointer-events-none absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-white text-[var(--color-primary)] shadow-sm"
          >
            <Sparkles className="size-2.5" />
          </motion.span>
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="leading-none"
      >
        <p className="font-heading text-2xl font-bold tracking-tight text-[var(--foreground)]">
          Len<span className="text-[var(--primary)]">&</span>em
        </p>
        {tagline && (
          <p className="hidden text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--foreground-muted)] sm:block">
            {tagline}
          </p>
        )}
      </motion.div>
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
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "group relative flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] px-5 py-2 text-sm font-bold tracking-[0.08em] text-white shadow-[0_6px_20px_rgba(107,63,160,0.3)] transition-shadow hover:shadow-[0_10px_28px_rgba(107,63,160,0.4)]",
        focusRingClass,
        full && "w-full px-10 py-3",
      )}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
      <span className="relative">Start</span>
      <ArrowRight className="relative size-4 transition-transform duration-200 group-hover:translate-x-1" />
    </motion.button>
  );
}

/* ── Badge số — background đỏ chữ trắng ── */
export function Counter({ children }: { children: ReactNode }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={String(children)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
        className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--destructive)] text-[10px] font-bold text-white shadow-sm z-10 ring-2 ring-[var(--background)]"
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}