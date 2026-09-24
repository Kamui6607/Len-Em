// ============================================================
// DatePicker — calendar popover for date fields.
//
// Replaces <input type="date"> because that native control renders in
// the BROWSER locale (MM/DD/YYYY on en-US), which looked wrong in this
// Vietnamese UI. The label shows the order requested through `format`
// (dd/mm/yyyy by default, mm/dd/yyyy for every date-of-birth field — the
// order the signup form sends them in) and the calendar uses the
// Vietnamese locale with month/year dropdowns.
//
// Value in/out is the display text in that same order
// (see src/lib/dateInput.ts).
// ============================================================

import { useState } from "react";
import { CalendarDays, X } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { vi } from "react-day-picker/locale";
import "react-day-picker/style.css";
import {
  dateToIso,
  displayToIso,
  isoToDisplayDate,
  isoToLocalDate,
  isoToUsDisplayDate,
  toIsoDateMonthFirst,
  usDisplayToIso,
} from "../../../lib/dateInput";

interface DatePickerProps {
  /** Display value: dd/mm/yyyy ("" = not set). */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  /**
   * Order of the display value. Defaults to dd/mm/yyyy; the admin user forms
   * ask for mm/dd/yyyy because that is the order the signup form sends/saves
   * `dateOfBirth` in.
   */
  format?: "dd/mm/yyyy" | "mm/dd/yyyy";
  /** Selectable year range — defaults to 1900 … current year. */
  fromYear?: number;
  toYear?: number;
  /** Allow clearing the value (optional fields such as date of birth). */
  clearable?: boolean;
  /** Trigger styling (defaults to the design-system `.input` class). */
  triggerClassName?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  fromYear = 1900,
  toYear = new Date().getFullYear(),
  clearable = true,
  format = "dd/mm/yyyy",
  triggerClassName,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const monthFirst = format === "mm/dd/yyyy";
  const resolvedPlaceholder = placeholder ?? (monthFirst ? "mm/dd/yyyy" : "dd/mm/yyyy");
  // Accept the value in either order, so a field that switched format still
  // opens the calendar on the date the admin actually picked.
  const iso = monthFirst
    ? (usDisplayToIso(value) ?? toIsoDateMonthFirst(value))
    : displayToIso(value);
  const selected = isoToLocalDate(iso) ?? undefined;

  const handleSelect = (date?: Date) => {
    if (!date) {
      onChange("");
    } else {
      const nextIso = dateToIso(date);
      onChange(monthFirst ? isoToUsDisplayDate(nextIso) : isoToDisplayDate(nextIso));
    }
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={resolvedPlaceholder}
          className={
            triggerClassName ??
            `input flex w-full items-center justify-between gap-2 text-left disabled:opacity-60 ${
              error ? "border-destructive" : ""
            }`
          }
        >
          <span className={value ? "" : "opacity-50"}>{value || resolvedPlaceholder}</span>
          <CalendarDays className="h-4 w-4 shrink-0 opacity-60" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        {/* z-index phải vượt --z-modal (500) của Dialog/admin-dialog, nếu không
            lịch sẽ mở ra nhưng bị modal che khuất (không chọn được ngày).
            Giữ dưới --z-toast (600) để toast luôn hiển thị trên cùng. */}
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-[510] rounded-2xl border p-3 shadow-xl outline-none"
          style={{
            background: "var(--card)",
            borderColor: "var(--border)",
            // react-day-picker theme → app design tokens
            "--rdp-accent-color": "var(--primary)",
            "--rdp-accent-background-color": "var(--primary-soft)",
            "--rdp-today-color": "var(--primary)",
            "--rdp-day-height": "36px",
            "--rdp-day-width": "36px",
            "--rdp-day_button-height": "34px",
            "--rdp-day_button-width": "34px",
            "--rdp-nav_button-height": "1.75rem",
            "--rdp-nav_button-width": "1.75rem",
            "--rdp-selected-border": "none",
          } as React.CSSProperties}
        >
          <DayPicker
            mode="single"
            locale={vi}
            selected={selected}
            onSelect={handleSelect}
            captionLayout="dropdown"
            startMonth={new Date(fromYear, 0)}
            endMonth={new Date(toYear, 11)}
            defaultMonth={selected ?? new Date(2000, 0)}
            disabled={{ after: new Date() }}
            showOutsideDays
            weekStartsOn={1}
            className="text-sm"
          />

          {clearable && value && (
            <div className="mt-2 border-t pt-2" style={{ borderColor: "var(--border-light)" }}>
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
                Xoá ngày
              </button>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
