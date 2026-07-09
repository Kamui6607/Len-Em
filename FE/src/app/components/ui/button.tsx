import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:shadow-[0_0_0_3px_rgba(107,63,160,0.15)] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive relative overflow-hidden leading-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--cta-gradient)] text-primary-foreground shadow-[var(--cta-shadow)] hover:shadow-[var(--cta-shadow-hover)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[var(--cta-shadow)] before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(255,255,255,0.15)_0%,transparent_100%)] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        destructive:
          "bg-destructive text-destructive-foreground hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0",
        outline:
          "border border-border bg-transparent text-foreground-secondary hover:border-primary hover:text-primary hover:bg-[rgba(107,63,160,0.04)] dark:hover:bg-[rgba(160,120,214,0.04)]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:-translate-y-0.5 active:translate-y-0",
        ghost:
          "text-foreground-muted hover:bg-[var(--chip-bg)] hover:text-foreground dark:hover:bg-[rgba(160,120,214,0.04)]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-5 py-2 has-[>svg]:px-3 rounded-xl",
        sm: "h-8 rounded-lg gap-1.5 px-3.5 has-[>svg]:px-2.5 text-xs",
        lg: "h-10 rounded-xl px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-lg",
        xl: "h-12 rounded-xl px-8 has-[>svg]:px-5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
