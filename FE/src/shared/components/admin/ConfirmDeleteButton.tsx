// ============================================================
// ConfirmDeleteButton — icon delete button + confirm dialog
// ============================================================
// Replaces the old "hold 2 seconds to delete" pattern: one click opens a
// styled confirmation dialog (same `.admin-dialog-*` shell as the other admin
// modals) and the delete only runs after the admin confirms.
// The dialog is portalled to <body> so it can never be clipped by a table's
// scroll container or trapped inside a transformed ancestor.
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { AdminModal } from "./AdminModal";

export interface ConfirmDeleteButtonProps {
  /** Runs the delete. May be async — the dialog shows a spinner while pending. */
  onDelete: () => void | Promise<void>;
  /** Name of the record, shown inside the dialog title. */
  itemName?: string;
  /** Icon button tooltip + aria-label (defaults to the shared "Xóa"). */
  title?: string;
  /** Blocks the action (e.g. the record is already inactive). */
  disabled?: boolean;
  /** Tooltip + aria-label used while `disabled`. */
  disabledTitle?: string;
  /** Extra classes for the icon button (e.g. size overrides in a table). */
  className?: string;
}

export function ConfirmDeleteButton({
  onDelete,
  itemName,
  title,
  disabled = false,
  disabledTitle,
  className,
}: ConfirmDeleteButtonProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    if (working) return;
    setOpen(false);
  }, [working]);

  // Focus lands on "Cancel" (the safe default); AdminModal handles Esc.
  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  const handleConfirm = async () => {
    try {
      setWorking(true);
      await onDelete();
      setOpen(false);
    } catch {
      // The caller reports the failure (toast) — keep the dialog open so the
      // admin can retry without hunting for the row again.
    } finally {
      setWorking(false);
    }
  };

  const buttonLabel = disabled
    ? disabledTitle ?? title ?? t("admin.confirmDelete.disabledHint")
    : title ?? t("admin.confirmDelete.buttonTitle");
  const dialogTitle = itemName
    ? t("admin.confirmDelete.title", { name: itemName })
    : t("admin.confirmDelete.titleGeneric");

  const trashButton = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      disabled={disabled}
      aria-disabled={disabled}
      aria-haspopup="dialog"
      className={`admin-action-btn delete ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className ?? ""}`}
      title={buttonLabel}
      aria-label={buttonLabel}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );

  return (
    <>
      {/* A disabled <button> does not reliably surface its `title` tooltip in
          every browser, so the "why is this disabled" hint is also attached to
          a wrapper element. */}
      {disabled ? (
        <span className="inline-flex" title={buttonLabel}>
          {trashButton}
        </span>
      ) : (
        trashButton
      )}

      {open && (
        <AdminModal
          variant="danger"
          size="sm"
          icon={Trash2}
          title={dialogTitle}
          onClose={close}
          footer={
            <>
              <button
                ref={cancelRef}
                type="button"
                onClick={close}
                disabled={working}
                className="btn-modal-cancel"
              >
                {t("admin.confirmDelete.cancel")}
              </button>
              <button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={working}
                className="btn-modal-destructive"
              >
                {working ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("admin.confirmDelete.deleting")}
                  </>
                ) : (
                  t("admin.confirmDelete.confirm")
                )}
              </button>
            </>
          }
        >
          <div className="admin-dialog-body">
            <p className="text-sm text-muted-foreground">{t("admin.confirmDelete.description")}</p>
          </div>
        </AdminModal>
      )}
    </>
  );
}
