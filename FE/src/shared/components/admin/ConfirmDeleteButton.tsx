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
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

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
  const titleId = useRef(`confirm-delete-${Math.random().toString(36).slice(2)}`).current;

  const close = useCallback(() => {
    if (working) return;
    setOpen(false);
  }, [working]);

  // Esc closes the dialog; focus lands on "Cancel" (the safe default).
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    cancelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

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

      {open &&
        createPortal(
          <div className="admin-dialog-overlay" onClick={close}>
            <div
              className="admin-dialog-content max-w-md"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="admin-dialog-header flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "var(--error-bg)", color: "var(--error-text)" }}
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <h2 id={titleId} className="text-base font-semibold">
                    {dialogTitle}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="admin-action-btn"
                  style={{ color: "var(--foreground-muted)" }}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="admin-dialog-body">
                <p className="text-sm text-muted-foreground">{t("admin.confirmDelete.description")}</p>
              </div>

              <div className="admin-dialog-footer">
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
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
