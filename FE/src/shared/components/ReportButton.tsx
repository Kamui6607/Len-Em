import { useState } from "react";
import { Flag } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { ReportFormDialog } from "../../features/orderReport/components/ReportFormDialog";
import type { ReportTargetType } from "../types/report.types";

interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId: string;
  /** Kept for call-site compatibility; the dialog shows the short order code. */
  targetTitle?: string;
  className?: string;
}

/**
 * Nút "Báo cáo sự cố" cho một đơn hàng — mở ReportFormDialog.
 * Chỉ hỗ trợ đơn hàng: BE chỉ có POST /order-reports (phải là đơn của chính
 * người gửi). Bài DIY chưa có API báo cáo nên nút không hiện cho chúng
 * (trước đây gửi id bài DIY như một orderId và luôn bị BE từ chối).
 */
export function ReportButton({ targetType, targetId, className = "" }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (targetType !== "purchased_order") return null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          // The order card in /purchased is a <Link>: without preventDefault the
          // anchor navigates to the order page as soon as the flag is clicked.
          e.preventDefault();
          e.stopPropagation();
          if (!isAuthenticated) {
            navigate("/auth/login");
            return;
          }
          setOpen(true);
        }}
        className={`rp-trigger ${className}`}
        aria-label="Báo cáo sự cố với đơn hàng"
        title="Báo cáo sự cố"
      >
        <Flag className="size-3.5" />
      </button>
      {/* Portal events still bubble through the React tree — keep clicks inside
          the dialog from reaching a parent <Link> / clickable card. */}
      <span className="contents" onClick={(e) => e.stopPropagation()}>
        <ReportFormDialog mode="create" orderId={targetId} open={open} onOpenChange={setOpen} />
      </span>
    </>
  );
}
