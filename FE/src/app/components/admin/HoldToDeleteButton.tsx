import { Trash2 } from "lucide-react";
import { useHoldToDelete } from "../../../hooks/useHoldToDelete";

interface HoldToDeleteButtonProps {
  onDelete: () => void;
  disabled?: boolean;
  title?: string;
}

export function HoldToDeleteButton({
  onDelete,
  disabled = false,
  title = "Hold 2s to delete",
}: HoldToDeleteButtonProps) {
  const { isHolding, holdProgress, startHold, cancelHold, cancelHoldOnLeave } =
    useHoldToDelete({
      onDelete,
    });

  const size = 28;
  const radius = 12;
  const circumference = 2 * Math.PI * radius;

  return (
    <button
      onPointerDown={(e) => {
        if (disabled) return;
        e.stopPropagation();
        e.preventDefault();
        startHold();
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        cancelHold();
      }}
      onPointerLeave={() => {
        cancelHoldOnLeave();
      }}
      onContextMenu={(e) => e.preventDefault()}
      className={`admin-action-btn delete relative ${
        isHolding ? "bg-destructive/20 text-destructive" : ""
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      style={{ width: size, height: size }}
      aria-label={title}
      title={title}
    >
      <Trash2 className="size-3.5" />
      {isHolding && (
        <svg
          className="absolute inset-0 -rotate-90"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--destructive)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${holdProgress * circumference} ${circumference}`}
            opacity="0.6"
          />
        </svg>
      )}
    </button>
  );
}