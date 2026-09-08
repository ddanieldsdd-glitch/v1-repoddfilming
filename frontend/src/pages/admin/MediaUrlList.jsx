import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadImageFile, cloudinaryFolderHint } from "../../lib/uploadImage";
import { ImageDropZone, handleTextareaImagePaste } from "../../components/admin/ImageDropZone";
import { textareaCls, uploadBtnCls } from "./styles";

export const MediaListItem = ({ previewUrl, previewFit = "cover", previewBg = "bg-neutral-800", children }) => (
  <li className="flex items-center gap-2 bg-white/5 border border-white/8 px-2 py-1.5 rounded">
    <div className={`shrink-0 w-12 h-8 ${previewBg} rounded overflow-hidden`}>
      {previewUrl && (
        <img
          src={previewUrl}
          alt=""
          className={`w-full h-full ${previewFit === "contain" ? "object-contain p-0.5" : "object-cover"}`}
        />
      )}
    </div>
    {children}
  </li>
);

export const MediaUrlList = ({
  label,
  items,
  onChange,
  getUrl = (item) => (typeof item === "string" ? item : item.url),
  mapUrl = (url) => url,
  renderExtras,
  projectSlug,
  assetType,
  onUploadStart,
  previewFit = "cover",
  previewBg = "bg-neutral-800",
}) => {
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const canUpload = !!projectSlug && !!assetType;
  const list = items || [];

  const commit = (urls) => {
    let next = [...list];
    urls.forEach((url) => {
      if (!url) return;
      if (next.some((item) => getUrl(item) === url)) return;
      next.push(mapUrl(url));
    });
    onChange(next);
  };

  const remove = (i) => onChange(list.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
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
    try {
      const urls = [];
      for (const file of fileArray) {
        urls.push(await uploadImageFile(file, { projectSlug, assetType }));
      }
      commit(urls);
      toast.success(urls.length === 1 ? "Imagen subida" : `${urls.length} imágenes subidas`);
    } catch (err) {
      toast.error(err.message || "Error al subir");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <ImageDropZone onFiles={handleUpload} disabled={!canUpload} uploading={uploading} multiple className="p-3">
      <div>
        <span className="block text-[10px] tracking-[0.28em] uppercase text-neutral-400 mb-2">
          {label}
          {list.length > 0 && (
            <span className="ml-2 text-neutral-600 normal-case tracking-normal">· {list.length}</span>
          )}
        </span>
        {list.length > 0 && (
          <ul className="mb-3 space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {list.map((item, i) => {
              const url = getUrl(item);
              return (
                <MediaListItem key={url + i} previewUrl={url} previewFit={previewFit} previewBg={previewBg}>
                  <span className="flex-1 text-[11px] text-neutral-500 truncate font-mono min-w-0">{url}</span>
                  {renderExtras?.(item, i)}
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="px-1 text-neutral-400" aria-label="Subir">↑</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} className="px-1 text-neutral-400" aria-label="Bajar">↓</button>
                  <button type="button" onClick={() => remove(i)} className="px-1 text-red-400" aria-label="Eliminar">✕</button>
                </MediaListItem>
              );
            })}
          </ul>
        )}
        <div className="flex gap-2 items-start">
          <textarea
            className={textareaCls + " min-h-[64px] flex-1 font-mono text-[12px]"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={canUpload ? "Pega URLs o arrastra imágenes" : "Define el slug para subir archivos"}
            onPaste={(e) =>
              handleTextareaImagePaste(e, handleUpload, {
                disabled: !canUpload,
                disabledMessage: "Define el slug del proyecto antes de subir imágenes",
              })
            }
          />
          <div className="flex flex-col gap-2">
            {canUpload && (
              <>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className={uploadBtnCls}>
                  {uploading ? "Subiendo…" : "Subir"}
                </button>
              </>
            )}
            <button
              type="button"
              className={uploadBtnCls}
              disabled={!input.trim()}
              onClick={() => {
                commit(input.split(/[\n\r]+/).map((s) => s.trim()).filter(Boolean));
                setInput("");
              }}
            >
              Añadir URL
            </button>
          </div>
        </div>
        {canUpload && (
          <p className="text-[9px] text-neutral-700 mt-1.5">Cloudinary → {cloudinaryFolderHint(projectSlug, assetType)}</p>
        )}
      </div>
    </ImageDropZone>
  );
};
