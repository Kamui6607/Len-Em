import { motion, AnimatePresence } from "motion/react";
import { CircleAlert as AlertCircle, TriangleAlert } from "lucide-react";
import "../../../styles/auth.css";

/** Error banner for the auth pages — slides open with a small shake.
 *  `tone="warning"` (amber) is for "almost locked out" notices. */
export function AuthError({ error, tone = "error" }: { error: string; tone?: "error" | "warning" }) {
  const Icon = tone === "warning" ? TriangleAlert : AlertCircle;
  return (
    <AnimatePresence initial={false}>
      {error && (
        <motion.div
          key={error}
          role="alert"
          initial={{ opacity: 0, height: 0, x: 0 }}
          animate={{ opacity: 1, height: "auto", x: [0, -6, 6, -3, 3, 0] }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.35 }}
          className="overflow-hidden"
        >
          <div className={`auth-error${tone === "warning" ? " is-warning" : ""}`}>
            <Icon size={16} className="mt-px shrink-0" />
            <span>{error}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
