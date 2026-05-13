import { cn } from "./ui/utils";
import { motion } from "motion/react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "text-center py-20 px-4 max-w-sm mx-auto",
        className
      )}
    >
      {icon && (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center"
        >
          {icon}
        </motion.div>
      )}
      <h3 className="text-lg mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="flex justify-center">{action}</div>}
    </motion.div>
  );
}