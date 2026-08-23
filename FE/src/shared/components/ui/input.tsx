import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-10 w-full min-w-0 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--foreground)] transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "hover:border-[var(--primary)]",
        "focus-visible:border-[var(--primary)] focus-visible:shadow-[0_0_0_4px_rgba(107,63,160,0.08)]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "dark:bg-[rgba(160,120,214,0.03)] dark:border-[rgba(61,46,79,0.8)] dark:text-[var(--foreground)]",
        "dark:hover:border-[var(--primary)] dark:focus-visible:border-[var(--primary)] dark:focus-visible:shadow-[0_0_0_4px_rgba(160,120,214,0.12)]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
