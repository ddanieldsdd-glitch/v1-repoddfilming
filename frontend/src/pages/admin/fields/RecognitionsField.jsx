import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadImageFile, cloudinaryFolderHint } from "../../../lib/uploadImage";
import { ImageDropZone, handleTextareaImagePaste } from "../../../components/admin/ImageDropZone";
import { mergeRecognitionUrls, normalizeRecognitions } from "../../../lib/recognitions";
import { Field } from "./Field";
import { inputCls, textareaCls, uploadBtnCls } from "../styles";
export const RecognitionsField = ({
  items,
  onChange,
  projectSlug,
  onUploadStart,
}) => {
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const canUpload = !!projectSlug;
  const list = normalizeRecognitions(items);

  const commitUrls = () => {
    const added = input
      .split(/[\n\r]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!added.length) return;
    onChange(mergeRecognitionUrls(list, added));
    setInput("");
  };

  const remove = (i) => {
    const next = [...list];
    next.splice(i, 1);
    onChange(next);
  };

  const move = (i, dir) => {
    const next = [...list];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const toggleFlag = (i, key) => {
    const next = list.map((item, idx) =>
      idx === i ? { ...item, [key]: !item[key] } : item,
    );
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
    let next = [...list];
    let added = 0;

    try {
      for (const file of fileArray) {
        const url = await uploadImageFile(file, { projectSlug, assetType: "recognitions" });
        const before = next.length;
        next = mergeRecognitionUrls(next, [url]);
        if (next.length > before) added += 1;
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
          Reconocimientos / premios (PNG blanco, fondo transparente)
          {list.length > 0 && (
            <span className="ml-2 text-neutral-600 normal-case tracking-normal">
              · {list.length} imagen{list.length !== 1 ? "es" : ""}
            </span>
          )}
        </span>

        {list.length > 0 && (
          <ul className="mb-3 space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {list.map((item, i) => (
              <li
                key={item.url + i}
                className="flex items-center gap-2 bg-white/5 border border-white/8 px-2 py-1.5 rounded group"
              >
                <div className="shrink-0 w-12 h-8 bg-black rounded overflow-hidden">
                  <img
                    src={item.url}
                    alt=""
                    className="w-full h-full object-contain p-0.5"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                </div>
                <span className="flex-1 text-[11px] text-neutral-500 truncate font-mono min-w-0">
                  {item.url}
                </span>
                <div className="shrink-0 flex items-center gap-2">
                  <label
                    className="flex items-center gap-1 cursor-pointer select-none"
                    title="Visible en tarjetas de la Home"
                  >
                    <input
                      type="checkbox"
                      checked={item.showOnHome}
                      onChange={() => toggleFlag(i, "showOnHome")}
                      className="w-3.5 h-3.5 accent-white"
                    />
                    <span className="text-[9px] tracking-[0.1em] uppercase text-neutral-500">
                      Home
                    </span>
                  </label>
                  <label
                    className="flex items-center gap-1 cursor-pointer select-none"
                    title="Visible en tarjetas de Work"
                  >
                    <input
                      type="checkbox"
                      checked={item.showOnWork}
                      onChange={() => toggleFlag(i, "showOnWork")}
                      className="w-3.5 h-3.5 accent-white"
                    />
                    <span className="text-[9px] tracking-[0.1em] uppercase text-neutral-500">
                      Work
                    </span>
                  </label>
                </div>
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
                    disabled={i === list.length - 1}
                    className="w-5 h-5 flex items-center justify-center text-neutral-500 hover:text-white disabled:opacity-20 text-[10px]"
                    aria-label="Bajar"
                  >↓</button>
                </div>
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
                commitUrls();
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
                  title={cloudinaryFolderHint(projectSlug, "recognitions")}
                >
                  {uploading ? "Subiendo…" : "Subir archivo"}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={commitUrls}
              disabled={!input.trim()}
              className={uploadBtnCls + " disabled:opacity-30"}
            >
              Añadir URL
            </button>
          </div>
        </div>
        <p className="text-[9px] text-neutral-700 mt-1.5">
          {canUpload
            ? `Cloudinary → ${cloudinaryFolderHint(projectSlug, "recognitions")} · Marca Home y/o Work para tarjetas · Orden = visualización · Ficha: todos`
            : "Marca Home/Work por premio · Ficha del proyecto: todos"}
        </p>
      </div>
    </ImageDropZone>
  );
};
