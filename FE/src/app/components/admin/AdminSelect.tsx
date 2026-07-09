import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export interface AdminSelectOption {
  value: string;
  label: string;
  dotClassName?: string;
  disabled?: boolean;
}

interface AdminSelectProps {
  value: string;
  options: AdminSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
}

export function AdminSelect({
  value,
  options,
  onChange,
  placeholder = "Select...",
  disabled = false,
  className = "",
  buttonClassName = "",
}: AdminSelectProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = options.find((option) => option.value === value);

  const updateCoords = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({ top: rect.bottom + 6, left: rect.left, width: rect.width });
  };

  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      const target = event.target as Node;
      const outsideTrigger = triggerRef.current && !triggerRef.current.contains(target);
      const outsideMenu = menuRef.current && !menuRef.current.contains(target);
      if (outsideTrigger && outsideMenu) setOpen(false);
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          if (!open) updateCoords();
          setOpen((current) => !current);
        }}
        style={{ background: "var(--select-bg)", color: "var(--foreground)" }}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${
          open ? "border-primary ring-2 ring-primary/20" : "hover:border-[var(--input-hover-border)]"
        } ${buttonClassName}`}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selected?.dotClassName && (
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selected.dotClassName}`} />
          )}
          <span
            className="truncate"
            style={{ color: selected ? "var(--foreground)" : "var(--foreground-placeholder)" }}
          >
            {selected?.label ?? placeholder}
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--foreground-muted)" }}
        />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          style={{ 
            position: "fixed", 
            top: coords.top, 
            left: coords.left, 
            width: coords.width, 
            zIndex: 9999,
            maxHeight: "300px",
            overflowY: "auto",
            overflowX: "hidden",
          }}
          className="glass-panel-solid py-1"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={option.disabled}
              onClick={() => {
                if (option.disabled) return;
                onChange(option.value);
                setOpen(false);
              }}
              style={{
                color: option.value === value ? "var(--foreground)" : "var(--foreground-muted)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--dropdown-hover-bg)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
            >
              {option.dotClassName && (
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${option.dotClassName}`} />
              )}
              <span className="flex-1 text-left truncate">{option.label}</span>
              {option.value === value && (
                <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--primary)" }} />
              )}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}