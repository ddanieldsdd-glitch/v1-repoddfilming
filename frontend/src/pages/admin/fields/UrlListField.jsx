import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadImageFile, cloudinaryFolderHint } from "../../../lib/uploadImage";
import { ImageDropZone, handleTextareaImagePaste } from "../../../components/admin/ImageDropZone";
import { mergeRecognitionUrls, normalizeRecognitions } from "../../../lib/recognitions";
import { Field } from "./Field";
import { inputCls, textareaCls, uploadBtnCls } from "../styles";
export const UrlListField = ({
  label,
  fieldKey,
  urls,
  onChange,
  previewFit = "cover",
  previewBg = "bg-neutral-800",
  projectSlug,
  assetType,
  onUploadStart,
}) => {
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const canUpload = !!projectSlug && !!assetType;

  const commit = () => {
    const added = input
      .split(/[\n\r]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!added.length) return;
    const next = [...(urls || [])];
    added.forEach((u) => { if (!next.includes(u)) next.push(u); });
    onChange(next);
    setInput("");
  };

  const remove = (i) => {
    const next = [...(urls || [])];
    next.splice(i, 1);
    onChange(next);
  };

  const move = (i, dir) => {
    const next = [...(urls || [])];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const handleUpload = async (files) => {
    const fileArray = Array.isArray(files) ? files : Array.from(files || []);
    if (!canUpload || !fileArray.length) {
      if (!projectSlug) toast.error("Define el slug del proyecto antes de subir imágenes");
      return;
    }
    onUploadStart?.();
    setUploading(true);
    const next = [...(urls || [])];
    let added = 0;

    try {
      for (const file of fileArray) {
        const url = await uploadImageFile(file, { projectSlug, assetType });
        if (!next.includes(url)) {
          next.push(url);
          added += 1;
        }
      }
      if (added) {
        onChange(next);
        toast.success(
          added === 1 ? "Imagen subida a Cloudinary" : `${added} imágenes subidas a Cloudinary`,
        );
      }
    } catch (err) {
      toast.error(err.message || "Error al subir");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <ImageDropZone
      onFiles={handleUpload}
      disabled={!canUpload}
      uploading={uploading}
      multiple
      className="p-3"
    >
    <div>
      <span className="block text-[10px] tracking-[0.28em] uppercase text-neutral-400 mb-2">
        {label}
        {urls?.length > 0 && (
          <span className="ml-2 text-neutral-600 normal-case tracking-normal">
            · {urls.length} imagen{urls.length !== 1 ? "es" : ""}
          </span>
        )}
      </span>

      {/* Lista de URLs existentes */}
      {(urls || []).length > 0 && (
        <ul className="mb-3 space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {urls.map((url, i) => (
            <li
              key={url + i}
              className="flex items-center gap-2 bg-white/5 border border-white/8 px-2 py-1.5 rounded group"
            >
              {/* Preview */}
              <div className={`shrink-0 w-12 h-8 ${previewBg} rounded overflow-hidden`}>
                <img
                  src={url}
                  alt=""
                  className={`w-full h-full ${previewFit === "contain" ? "object-contain p-0.5" : "object-cover"}`}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </div>
              {/* URL truncada */}
              <span className="flex-1 text-[11px] text-neutral-500 truncate font-mono min-w-0">
                {url}
              </span>
              {/* Orden */}
              <div className="shrink-0 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="w-5 h-5 flex items-center justify-center text-neutral-500 hover:text-white disabled:opacity-20 text-[10px]"
                  aria-label="Subir"
                >↑</button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === urls.length - 1}
                  className="w-5 h-5 flex items-center justify-center text-neutral-500 hover:text-white disabled:opacity-20 text-[10px]"
                  aria-label="Bajar"
                >↓</button>
              </div>
              {/* Eliminar */}
              <button
                type="button"
                onClick={() => remove(i)}
                className="shrink-0 w-5 h-5 flex items-center justify-center text-neutral-600 hover:text-red-400 transition-colors text-[11px] opacity-0 group-hover:opacity-100"
                aria-label="Eliminar"
              >✕</button>
            </li>
          ))}
        </ul>
      )}

      {/* Input para añadir nuevas URLs o subir archivos */}
      <div className="flex gap-2 items-start">
        <textarea
          className={textareaCls + " min-h-[64px] flex-1 font-mono text-[12px]"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={canUpload ? "Pega URLs o arrastra imágenes aquí" : "Define el slug del proyecto para subir archivos"}
          onPaste={(e) =>
            handleTextareaImagePaste(e, handleUpload, {
              disabled: !canUpload,
              disabledMessage: "Define el slug del proyecto antes de subir imágenes",
            })
          }
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
        />
        <div className="shrink-0 flex flex-col gap-2 self-end">
          {canUpload && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className={uploadBtnCls}
                title={cloudinaryFolderHint(projectSlug, assetType)}
              >
                {uploading ? "Subiendo…" : "Subir archivo"}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={commit}
            disabled={!input.trim()}
            className={uploadBtnCls + " disabled:opacity-30"}
          >
            Añadir URL
          </button>
        </div>
      </div>
      <p className="text-[9px] text-neutral-700 mt-1.5">
        {canUpload
          ? `Cloudinary → ${cloudinaryFolderHint(projectSlug, assetType)} · Arrastra, pega imagen (⌘V) o URL · ⌘+Enter para añadir URL`
          : "Pega varias URLs a la vez · ⌘+Enter para añadir"}
      </p>
    </div>
    </ImageDropZone>
  );
};
