import { useEffect, useRef } from "react";
import { AdminButton } from "./AdminButton";

export const AdminDialog = ({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
  testId = "admin-confirm-dialog",
  children,
}) => {
  const confirmRef = useRef(null);
  const cancelRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    confirmRef.current?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel?.();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
      const nodes = [...(focusable || [])].filter((node) => !node.disabled);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
      data-testid={testId}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-dialog-title"
    >
      <div ref={panelRef} className="w-full max-w-md border border-white/15 bg-[#0a0a0a] p-6 shadow-2xl">
        <h3 id="admin-dialog-title" className="text-lg font-light text-white mb-2">{title}</h3>
        {description && <p className="text-sm text-neutral-400 mb-4">{description}</p>}
        {children}
        <div className="flex justify-end gap-3 mt-6">
          <AdminButton ref={cancelRef} variant="ghost" onClick={onCancel}>Cancelar</AdminButton>
          <AdminButton
            ref={confirmRef}
            variant={confirmVariant}
            data-testid="admin-delete-confirm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </AdminButton>
        </div>
      </div>
    </div>
  );
};
