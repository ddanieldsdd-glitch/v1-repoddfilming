export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  onConfirm,
  onCancel,
  testId = "admin-confirm-dialog",
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6" data-testid={testId}>
      <div className="w-full max-w-md border border-white/15 bg-[#0a0a0a] p-6 shadow-2xl">
        <h3 className="text-lg font-light text-white mb-2">{title}</h3>
        <p className="text-sm text-neutral-400 mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="border border-white/20 px-4 py-2 text-[10px] tracking-[0.22em] uppercase text-neutral-300 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            data-testid="admin-delete-confirm"
            onClick={onConfirm}
            className="border border-red-400/60 px-4 py-2 text-[10px] tracking-[0.22em] uppercase text-red-300 hover:bg-red-400 hover:text-black transition"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
