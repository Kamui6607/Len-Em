"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "./utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer data-[state=checked]:bg-[var(--primary)] data-[state=unchecked]:bg-[var(--switch-bg)] dark:data-[state=unchecked]:bg-[rgba(61,46,79,0.8)] inline-flex h-[1.25rem] w-[2.125rem] shrink-0 items-center rounded-full border border-transparent transition-all outline-none focus-visible:shadow-[0_0_0_3px_rgba(107,63,160,0.15)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-white dark:data-[state=unchecked]:bg-[var(--foreground-muted)] dark:data-[state=checked]:bg-white pointer-events-none block size-[0.9375rem] rounded-full shadow-[var(--shadow-sm)] transition-transform data-[state=checked]:translate-x-[calc(100%+1px)] data-[state=unchecked]:translate-x-[2px]",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
