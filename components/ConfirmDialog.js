import { useEffect, useRef } from "react";

/**
 * System-style alert for anything irreversible: signing out, and removing a
 * criterion, participant or judge once scores exist.
 *
 * Focus is trapped while open and restored to whatever opened it. Without the
 * trap, `aria-modal` would be a claim the implementation does not honour.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  onConfirm,
  onCancel,
}) {
  const cardRef = useRef(null);
  const cancelRef = useRef(null);
  const openerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    openerRef.current = document.activeElement;
    if (cancelRef.current) cancelRef.current.focus();

    function onKeyDown(e) {
      if (e.key === "Escape") {
        onCancel();
        return;
      }
      if (e.key !== "Tab" || !cardRef.current) return;

      const focusable = cardRef.current.querySelectorAll("button");
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (openerRef.current && openerRef.current.focus) openerRef.current.focus();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="alert-scrim" onClick={onCancel}>
      <div
        className="alert"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-title"
        aria-describedby="alert-message"
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="alert-body">
          <h2 id="alert-title">{title}</h2>
          <p id="alert-message">{message}</p>
        </div>
        <div className="alert-actions">
          <button type="button" ref={cancelRef} onClick={onCancel} className="preferred">
            {cancelLabel}
          </button>
          <button
            type="button"
            className={tone === "danger" ? "destructive" : ""}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
