import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

function pickImageFiles(fileList) {
  return Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
}

function filesFromClipboard(dataTransfer) {
  if (!dataTransfer) return [];
  const fromItems = Array.from(dataTransfer.items || [])
    .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter(Boolean);
  if (fromItems.length) return fromItems;
  return pickImageFiles(dataTransfer.files);
}

/**
 * Zona interactiva: arrastrar, soltar y pegar imágenes (⌘V / Ctrl+V).
 */
export function ImageDropZone({
  children,
  onFiles,
  disabled = false,
  disabledMessage = "Define el slug del proyecto antes de subir imágenes",
  uploading = false,
  multiple = false,
  className = "",
  compact = false,
}) {
  const [dragOver, setDragOver] = useState(false);
  const dragDepth = useRef(0);

  const ingest = useCallback(
    (fileList) => {
      if (disabled) {
        toast.error(disabledMessage);
        return;
      }
      const files = pickImageFiles(fileList);
      if (!files.length) {
        toast.error("Solo se permiten imágenes");
        return;
      }
      onFiles(multiple ? files : [files[0]]);
    },
    [disabled, disabledMessage, multiple, onFiles],
  );

  const handlePaste = useCallback(
    (e) => {
      const files = filesFromClipboard(e.clipboardData);
      if (!files.length) return;
      e.preventDefault();
      ingest(files);
    },
    [ingest],
  );

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current += 1;
    if (!disabled) setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDragOver(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current = 0;
    setDragOver(false);
    ingest(e.dataTransfer.files);
  };

  const zoneCls = [
    "relative rounded-md transition-colors outline-none",
    disabled ? "opacity-60" : "focus-within:ring-1 focus-within:ring-white/20",
    dragOver && !disabled
      ? "ring-2 ring-white/50 bg-white/5"
      : !compact
        ? "border border-dashed border-white/15 hover:border-white/30"
        : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      role="group"
      tabIndex={disabled ? -1 : 0}
      aria-label="Zona para arrastrar o pegar imágenes"
      className={zoneCls}
      onPaste={handlePaste}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}

      {!compact && !disabled && (
        <p className="text-[9px] text-neutral-600 mt-2 pointer-events-none select-none">
          Arrastra imágenes aquí · clic para enfocar y pegar (⌘V)
        </p>
      )}

      {dragOver && !disabled && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-black/75 border-2 border-white/40 pointer-events-none">
          <span className="text-[11px] tracking-[0.2em] uppercase text-white">
            Soltar imagen{multiple ? "es" : ""}
          </span>
        </div>
      )}

      {uploading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-md bg-black/80 pointer-events-none">
          <span className="text-[11px] tracking-[0.2em] uppercase text-white/90">
            Subiendo…
          </span>
        </div>
      )}
    </div>
  );
}

/** Pega imágenes en un textarea sin interferir con URLs de texto. */
export function handleTextareaImagePaste(e, onFiles, { disabled, disabledMessage } = {}) {
  const files = filesFromClipboard(e.clipboardData);
  if (!files.length) return false;
  e.preventDefault();
  if (disabled) {
    toast.error(disabledMessage);
    return true;
  }
  onFiles(files);
  return true;
}

export { pickImageFiles, filesFromClipboard };
