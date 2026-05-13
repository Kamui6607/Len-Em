import { useEffect, useRef, useState } from "react";
import { ArrowUp, ArrowDown, Check, ChevronDown } from "lucide-react";
import { cn } from "../ui/utils";

export interface SortOption {
  value: string;
  label: string;
}

interface SortDropdownProps {
  options: SortOption[];
  value: string;
  onChange: (value: string) => void;
  direction?: "asc" | "desc";
  onDirectionChange?: (direction: "asc" | "desc") => void;
  className?: string;
}

export function SortDropdown({
  options,
  value,
  onChange,
  direction = "asc",
  onDirectionChange,
  className,
}: SortDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleDirectionToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDirectionChange?.(direction === "asc" ? "desc" : "asc");
  };

  return (
    <>
      <style>{`
        .sort-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          font-family: 'DM Sans', sans-serif;
        }

        .sort-direction-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: var(--surface, #FFF9F5);
          border: 1.5px solid rgba(193,96,78,0.22);
          border-radius: 12px;
          cursor: pointer;
          color: #C1604E;
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
          flex-shrink: 0;
        }
        .sort-direction-btn:hover {
          border-color: rgba(193,96,78,0.5);
          background: #F9EDE8;
        }
        .sort-direction-btn:active { transform: scale(0.92); }
        .dark .sort-direction-btn {
          background: rgba(255,249,245,0.06);
          border-color: rgba(232,153,122,0.2);
          color: #E8997A;
        }
        .dark .sort-direction-btn:hover {
          background: rgba(232,153,122,0.12);
          border-color: rgba(232,153,122,0.4);
        }

        .sort-direction-icon {
          transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1);
        }
        .sort-direction-btn:hover .sort-direction-icon {
          transform: translateY(-1px);
        }

        .sort-trigger {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 14px 9px 12px;
          background: var(--surface, #FFF9F5);
          border: 1.5px solid rgba(193,96,78,0.22);
          border-radius: 14px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 400;
          color: #2A1A14;
          transition: border-color 0.2s, background 0.2s;
          white-space: nowrap;
          min-width: 148px;
          justify-content: space-between;
        }
        .sort-trigger:hover {
          border-color: rgba(193,96,78,0.5);
          background: #F9EDE8;
        }
        .sort-trigger.is-open {
          border-color: #C1604E;
          box-shadow: 0 0 0 3px rgba(193,96,78,0.14);
          background: #F9EDE8;
        }
        .dark .sort-trigger {
          background: rgba(255,249,245,0.06);
          border-color: rgba(232,153,122,0.2);
          color: #F5EDE8;
        }
        .dark .sort-trigger:hover {
          background: rgba(232,153,122,0.1);
          border-color: rgba(232,153,122,0.38);
        }
        .dark .sort-trigger.is-open {
          border-color: #E8997A;
          box-shadow: 0 0 0 3px rgba(232,153,122,0.15);
          background: rgba(232,153,122,0.1);
        }

        .sort-trigger-left {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .sort-chevron {
          color: #8A6860;
          flex-shrink: 0;
          transition: transform 0.25s cubic-bezier(0.16,1,0.3,1);
        }
        .sort-chevron.rotated { transform: rotate(180deg); }
        .dark .sort-chevron { color: #9A7870; }

        @keyframes sortFadeIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .sort-panel {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 200px;
          background: #FFF9F5;
          border: 1.5px solid rgba(193,96,78,0.18);
          border-radius: 18px;
          padding: 6px;
          z-index: 999;
          box-shadow: 0 8px 28px rgba(193,96,78,0.14), 0 2px 8px rgba(42,26,20,0.06);
          animation: sortFadeIn 0.22s cubic-bezier(0.16,1,0.3,1) both;
        }
        .dark .sort-panel {
          background: #1A110E;
          border-color: rgba(232,153,122,0.18);
          box-shadow: 0 8px 28px rgba(0,0,0,0.45);
        }

        .sort-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 9px 12px;
          border-radius: 12px;
          border: none;
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 400;
          color: #2A1A14;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s, color 0.15s;
          gap: 8px;
        }
        .sort-option:hover { background: #F9EDE8; }
        .sort-option.selected {
          background: rgba(232,153,122,0.18);
          color: #2A1A14;
          font-weight: 500;
        }
        .dark .sort-option { color: #F0E0D8; }
        .dark .sort-option:hover { background: rgba(232,153,122,0.1); }
        .dark .sort-option.selected {
          background: rgba(232,153,122,0.16);
          color: #F5EDE8;
        }

        .sort-check {
          width: 18px;
          height: 18px;
          border-radius: 6px;
          background: #C1604E;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .dark .sort-check { background: #E8997A; }

        .sort-divider {
          height: 1px;
          background: rgba(193,96,78,0.12);
          margin: 4px 8px;
        }
        .dark .sort-divider { background: rgba(232,153,122,0.12); }
      `}</style>

      <div ref={ref} className={cn("sort-wrap", className)}>
        <button
          className="sort-direction-btn"
          onClick={handleDirectionToggle}
          aria-label={
            direction === "asc"
              ? "Tăng dần, bấm để đổi sang giảm dần"
              : "Giảm dần, bấm để đổi sang tăng dần"
          }
          title={direction === "asc" ? "Tăng dần" : "Giảm dần"}
        >
          {direction === "asc" ? (
            <ArrowUp size={15} className="sort-direction-icon" />
          ) : (
            <ArrowDown size={15} className="sort-direction-icon" />
          )}
        </button>

        <button
          className={cn("sort-trigger", open && "is-open")}
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Sắp xếp theo"
        >
          <span className="sort-trigger-left">
            <span>{selected.label}</span>
          </span>
          <ChevronDown
            size={14}
            className={cn("sort-chevron", open && "rotated")}
          />
        </button>

        {open && (
          <div
            className="sort-panel"
            role="listbox"
            aria-label="Tùy chọn sắp xếp"
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              return (
                <div key={opt.value}>
                  <button
                    role="option"
                    aria-selected={isSelected}
                    className={cn("sort-option", isSelected && "selected")}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <span className="sort-check">
                        <Check size={11} color="white" strokeWidth={2.5} />
                      </span>
                    )}
                  </button>
                  {i === 0 && <div className="sort-divider" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
