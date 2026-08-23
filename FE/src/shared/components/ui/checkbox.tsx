"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "./utils";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border border-[var(--border)] bg-white dark:bg-[rgba(160,120,214,0.03)] data-[state=checked]:bg-[var(--primary)] data-[state=checked]:text-white data-[state=checked]:border-[var(--primary)] size-4 shrink-0 rounded-[5px] transition-all outline-none focus-visible:shadow-[0_0_0_3px_rgba(107,63,160,0.15)] disabled:cursor-not-allowed disabled:opacity-50 hover:border-[var(--primary)]",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
