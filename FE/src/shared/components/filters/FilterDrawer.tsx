import { X, SlidersHorizontal } from "lucide-react";
import { cn } from "../ui/utils";
import type { ReactNode } from "react";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  /** Number of active filters to show on the toggle button badge */
  activeFilterCount?: number;
  /** Text for the apply/show results button */
  applyText?: string;
  onApply?: () => void;
  hasActiveFilters?: boolean;
}

/** Mobile filter toggle button */
export function FilterToggleButton({
  onClick,
  activeFilterCount,
}: {
  onClick: () => void;
  activeFilterCount?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "md:hidden flex items-center gap-2 px-4 py-2 rounded-xl border transition-all shrink-0",
        "focus:outline-none focus:ring-2 focus:ring-primary/30",
        activeFilterCount && activeFilterCount > 0
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-foreground border-border hover:bg-muted"
      )}
      aria-label="Toggle filters"
    >
      <SlidersHorizontal className="w-4 h-4" />
      <span className="text-sm">Filters</span>
      {activeFilterCount && activeFilterCount > 0 && (
        <span className="bg-white/20 text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {activeFilterCount}
        </span>
      )}
    </button>
  );
}

/** Mobile bottom-sheet filter drawer */
export function FilterDrawer({
  isOpen,
  onClose,
  children,
  title = "Filters",
  activeFilterCount,
  applyText,
  onApply,
  hasActiveFilters,
}: FilterDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 md:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] bg-card rounded-t-3xl shadow-2xl md:hidden overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
          <h3 className="font-medium">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>

        {/* Footer action */}
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4">
          <button
            onClick={() => {
              onApply?.();
              onClose();
            }}
            className="w-full bg-primary text-primary-foreground py-3 rounded-full hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {applyText ||
              (hasActiveFilters
                ? `Show results (${activeFilterCount} filter${activeFilterCount && activeFilterCount > 1 ? "s" : ""} active)`
                : "Show all results")}
          </button>
        </div>
      </div>
    </>
  );
}