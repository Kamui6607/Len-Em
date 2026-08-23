import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../ui/utils";

interface FilterSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

/** Collapsible filter section */
export function FilterSection({
  title,
  children,
  defaultOpen = true,
}: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-2 group"
        aria-expanded={open}
        aria-label={`Toggle ${title} section`}
      >
        <span className="text-sm font-medium cursor-pointer group-hover:text-primary transition-colors">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  );
}

interface FilterListOption {
  label: string;
  count?: number;
}

interface FilterSidebarProps {
  children: ReactNode;
  className?: string;
  /** Render inside a sticky container? Default true for desktop sidebar */
  sticky?: boolean;
}

/** Desktop sidebar container with sticky positioning */
export function FilterSidebar({
  children,
  className,
  sticky = true,
}: FilterSidebarProps) {
  return (
    <aside className={cn("hidden md:block w-64 shrink-0", className)}>
      <div
        className={cn(
          sticky && "sticky top-24",
          "bg-card rounded-2xl border border-border p-5"
        )}
      >
        {children}
      </div>
    </aside>
  );
}

/** Reusable filter list item (checkbox-style button) */
export function FilterListItem({
  label,
  count,
  isSelected,
  onClick,
}: FilterListOption & {
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-primary/30",
        isSelected
          ? "bg-primary/10 text-primary font-medium"
          : "text-foreground hover:bg-muted"
      )}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </button>
  );
}