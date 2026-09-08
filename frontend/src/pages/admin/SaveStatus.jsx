export const SaveStatus = ({ saveState, lastSavedAt, onReload }) => {
  if (saveState === "idle" && !lastSavedAt) return null;

  const label =
    saveState === "saving"
      ? "Guardando…"
      : saveState === "saved" && lastSavedAt
        ? `Guardado ${formatRelative(lastSavedAt)}`
        : saveState === "error"
          ? "Error al guardar"
          : saveState === "conflict"
            ? "Conflicto de versión"
            : lastSavedAt
              ? `Guardado ${formatRelative(lastSavedAt)}`
              : "";

  return (
    <div
      className={`text-[10px] tracking-[0.18em] uppercase ${
        saveState === "error" || saveState === "conflict"
          ? "text-amber-400"
          : "text-neutral-500"
      }`}
      data-testid="admin-save-status"
    >
      {label}
      {saveState === "conflict" && onReload && (
        <button
          type="button"
          onClick={onReload}
          className="ml-3 border border-amber-400/40 px-2 py-0.5 text-[9px] hover:bg-amber-400 hover:text-black transition"
        >
          Recargar
        </button>
      )}
    </div>
  );
};

function formatRelative(date) {
  const seconds = Math.max(1, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return `hace ${seconds}s`;
  const minutes = Math.round(seconds / 60);
  return `hace ${minutes} min`;
}
