import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[0.6875rem] font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring-color)] transition-all overflow-hidden leading-[1.4]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--cta-gradient)] text-primary-foreground shadow-[var(--cta-shadow)]",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline:
          "text-foreground border-[var(--border)]",
        success:
          "border-transparent bg-[var(--accent-green)] text-[var(--accent-green-text)]",
        warning:
          "border-transparent bg-[var(--accent-orange)] text-[var(--accent-orange-text)]",
        error:
          "border-transparent bg-[var(--accent-red)] text-[var(--accent-red-text)]",
        info:
          "border-transparent bg-[var(--accent-blue)] text-[var(--accent-blue-text)]",
        pink:
          "border-transparent bg-[var(--badge-pink-bg)] text-[var(--badge-pink-text)]",
        yellow:
          "border-transparent bg-[var(--badge-yellow-bg)] text-[var(--badge-yellow-text)]",
        peach:
          "border-transparent bg-[var(--badge-peach-bg)] text-[var(--badge-peach-text)]",
        warm:
          "border-transparent bg-[var(--badge-warm-bg)] text-[var(--badge-warm-text)]",
        gray:
          "border-transparent bg-[var(--accent-gray)] text-[var(--accent-gray-text)]",
        lavender:
          "border-transparent bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
