import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  loadContent,
  fetchContent,
  pushContent,
  resetContent,
  isAdminAuthed,
  setAdminAuthed,
  CATEGORIES,
  slugify,
  newProjectId,
  getDefaultContent,
  saveContent,
} from "../lib/contentStore";
import { getProjectVideoSeoLabel } from "../lib/videoSeo";
import { uploadImageFile, cloudinaryFolderHint } from "../lib/uploadImage";
import { ImageDropZone, handleTextareaImagePaste } from "../components/admin/ImageDropZone";
import {
  mergeRecognitionUrls,
  normalizeRecognitions,
} from "../lib/recognitions";
import { HOME_SIZES, stillChoices } from "../lib/homeGrid";

const uploadBtnCls =
  "shrink-0 border border-white/25 px-3 py-2 text-[10px] tracking-[0.22em] uppercase text-white hover:bg-white hover:text-black transition disabled:opacity-30";

const ImageUrlField = ({
  label,
  value,
  onChange,
  projectSlug,
  assetType,
  testId,
  placeholder = "https://res.cloudinary.com/...",
  previewFit = "cover",
  previewBg = "bg-neutral-800",
  onUploadStart,
}) => {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const canUpload = assetType === "site" || !!projectSlug;

  const handleUpload = async (files) => {
    const file = Array.isArray(files) ? files[0] : files?.[0];
    if (!file) return;
    if (!canUpload) {
      toast.error("Define el slug del proyecto antes de subir imágenes");
      return;
    }
    onUploadStart?.();
    setUploading(true);
    try {
      const url = await uploadImageFile(file, { projectSlug, assetType });
      onChange(url);
      toast.success("Imagen subida a Cloudinary");
    } catch (err) {
      toast.error(err.message || "Error al subir");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Field label={label}>
      <ImageDropZone
        onFiles={handleUpload}
        disabled={!canUpload}
        uploading={uploading}
        multiple={false}
        className="p-3"
      >
      <div className="flex gap-2 items-start">
        <input
          data-testid={testId}
          className={inputCls}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || !canUpload}
          className={uploadBtnCls + " self-stretch"}
          title={canUpload ? cloudinaryFolderHint(projectSlug, assetType) : "Define el slug primero"}
        >
          {uploading ? "Subiendo…" : "Subir"}
        </button>
      </div>
      {assetType !== "site" && (
        <p className="text-[9px] text-neutral-700 mt-1.5 font-mono">
          Cloudinary → {cloudinaryFolderHint(projectSlug, assetType)}
        </p>
      )}
      {value && (
        <div className={`mt-2 w-full max-w-[200px] aspect-video ${previewBg} rounded overflow-hidden border border-white/10`}>
          <img
            src={value}
            alt=""
            className={`w-full h-full ${previewFit === "contain" ? "object-contain p-1" : "object-cover"}`}
            onError={(e) => { e.target.style.display = "none"; }}
          />
        </div>
      )}
      </ImageDropZone>
    </Field>
  );
};

const Field = ({ label, children }) => (
  <label className="block">
    <span className="block text-[10px] tracking-[0.28em] uppercase text-neutral-400 mb-2">
      {label}
    </span>
    {children}
  </label>
);

const inputCls =
  "w-full border border-white/20 px-3 py-2 text-sm focus:outline-none focus:border-white/60 bg-[#111] text-white placeholder:text-neutral-500";

const textareaCls = inputCls + " min-h-[90px] resize-y";

/** Gestor visual de lista de URLs de imágenes */
const UrlListField = ({
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

/** Reconocimientos con control de visibilidad en Home/Work y orden. */
const RecognitionsField = ({
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

const ProjectForm = ({ value, onChange }) => {
  const update = (patch) => onChange({ ...value, ...patch });
  const updateI18n = (key, lang, v) =>
    onChange({ ...value, [key]: { ...(value[key] || {}), [lang]: v } });
  const projectSlug = value.slug || slugify(value.title || "");
  const ensureSlug = () => {
    if (!value.slug && projectSlug) update({ slug: projectSlug });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Field label="Title">
        <input
          data-testid="form-title"
          className={inputCls}
          value={value.title || ""}
          onChange={(e) => {
            const t = e.target.value;
            update({ title: t, slug: value.slug || slugify(t) });
          }}
        />
      </Field>
      <Field label="Slug">
        <input
          data-testid="form-slug"
          className={inputCls}
          value={value.slug || ""}
          onChange={(e) => update({ slug: slugify(e.target.value) })}
        />
      </Field>
      <Field label="Category">
        <select
          data-testid="form-category"
          className={inputCls}
          value={value.category || "fiction"}
          onChange={(e) => update({ category: e.target.value })}
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.en}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Year">
        <input
          data-testid="form-year"
          type="number"
          className={inputCls}
          value={value.year || ""}
          onChange={(e) => update({ year: parseInt(e.target.value, 10) || "" })}
        />
      </Field>
      <Field label="Director(s)">
        <input
          className={inputCls}
          value={value.director || ""}
          onChange={(e) => update({ director: e.target.value })}
        />
      </Field>
      <Field label="Production company">
        <input
          className={inputCls}
          value={value.production_company || ""}
          onChange={(e) => update({ production_company: e.target.value })}
        />
      </Field>
      <Field label="Format details (camera / lens)">
        <input
          className={inputCls}
          value={value.format || ""}
          onChange={(e) => update({ format: e.target.value })}
        />
      </Field>
      <Field label="Type ES (e.g. Largometraje)">
        <input
          className={inputCls}
          value={value.type?.es || ""}
          onChange={(e) => updateI18n("type", "es", e.target.value)}
        />
      </Field>
      <Field label="Type EN (e.g. Feature Film)">
        <input
          className={inputCls}
          value={value.type?.en || ""}
          onChange={(e) => updateI18n("type", "en", e.target.value)}
        />
      </Field>
      <ImageUrlField
        label="Cover image"
        testId="form-cover"
        value={value.cover || ""}
        onChange={(url) => update({ cover: url })}
        projectSlug={projectSlug}
        assetType="cover"
        onUploadStart={ensureSlug}
      />
      <Field label="Video embed / preview URL (Vimeo or YouTube)">
        <input
          data-testid="form-preview"
          className={inputCls}
          value={value.preview_url || ""}
          onChange={(e) => update({ preview_url: e.target.value })}
          placeholder="https://vimeo.com/... o https://youtube.com/watch?v=..."
        />
        <p className="mt-1 text-[11px] text-neutral-500">
          Con URL de vídeo, la página del proyecto se indexa automáticamente como watch page en Google.
        </p>
      </Field>
      <ImageUrlField
        label="Poster / cartel (optional)"
        testId="form-poster"
        value={value.poster || ""}
        onChange={(url) => update({ poster: url })}
        projectSlug={projectSlug}
        assetType="poster"
        onUploadStart={ensureSlug}
      />
      <Field label="External link (optional)">
        <input
          className={inputCls}
          value={value.external_link || ""}
          onChange={(e) => update({ external_link: e.target.value })}
        />
      </Field>
      <Field label="Synopsis ES">
        <textarea
          className={textareaCls}
          value={value.synopsis?.es || ""}
          onChange={(e) => updateI18n("synopsis", "es", e.target.value)}
        />
      </Field>
      <Field label="Synopsis EN">
        <textarea
          className={textareaCls}
          value={value.synopsis?.en || ""}
          onChange={(e) => updateI18n("synopsis", "en", e.target.value)}
        />
      </Field>
      <div className="md:col-span-2">
        <RecognitionsField
          items={value.recognitions || []}
          onChange={(next) => update({ recognitions: next })}
          projectSlug={projectSlug}
          onUploadStart={ensureSlug}
        />
      </div>
      <UrlListField
        label="Stills"
        fieldKey="stills"
        urls={value.stills || []}
        onChange={(next) => update({ stills: next })}
        projectSlug={projectSlug}
        assetType="stills"
        onUploadStart={ensureSlug}
      />
      <UrlListField
        label="BTS"
        fieldKey="bts"
        urls={value.bts || []}
        onChange={(next) => update({ bts: next })}
        projectSlug={projectSlug}
        assetType="bts"
        onUploadStart={ensureSlug}
      />
      <div className="md:col-span-2">
        <Field label="Visibilidad">
          <label className="flex items-center gap-3 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={value.published !== false}
              onChange={(e) => update({ published: e.target.checked })}
              className="w-4 h-4 accent-black"
            />
            <span className="text-sm text-neutral-300">
              Publicado — visible en el sitio
            </span>
          </label>
        </Field>
        <div className="mt-5 rounded-xl border border-white/10 p-4 space-y-4">
          <p className="text-[10px] tracking-[0.28em] uppercase text-neutral-500">
            Portada
          </p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={value.home_featured !== false}
              onChange={(e) => update({ home_featured: e.target.checked })}
              className="w-4 h-4 accent-black"
            />
            <span className="text-sm text-neutral-300">Mostrar en la pantalla principal</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Orden en home">
              <input
                type="number"
                min={1}
                className={inputCls}
                value={value.home_order ?? ""}
                onChange={(e) => update({ home_order: parseInt(e.target.value, 10) || "" })}
              />
            </Field>
            <Field label="Tamaño en la parrilla">
              <select
                className={inputCls}
                value={value.home_size || "medium"}
                onChange={(e) => update({ home_size: e.target.value })}
              >
                {HOME_SIZES.map((s) => (
                  <option key={s.id} value={s.id}>{s.es}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Still de portada">
            <div className="flex flex-wrap gap-2 mt-1">
              {stillChoices(value).map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => update({ home_still: url })}
                  className={`relative h-16 w-24 overflow-hidden rounded-lg border ${
                    (value.home_still || value.cover) === url
                      ? "border-white ring-1 ring-white"
                      : "border-white/15 hover:border-white/40"
                  }`}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </Field>
        </div>
      </div>
    </div>
  );
};

const HomeLayoutSection = ({ content, onSave, saving }) => {
  const snapshot = (projects) =>
    (projects || []).map((p, i) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      cover: p.cover,
      stills: p.stills || [],
      home_featured: p.home_featured !== false,
      home_order: Number.isFinite(Number(p.home_order)) ? Number(p.home_order) : i + 1,
      home_size: p.home_size || "medium",
      home_still: p.home_still || "",
    }));

  const [rows, setRows] = useState(() => snapshot(content.projects));
  useEffect(() => setRows(snapshot(content.projects)), [content.projects]);

  const patch = (id, next) =>
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...next } : r)));

  const handleSave = async () => {
    try {
      const projects = content.projects.map((p) => {
        const row = rows.find((r) => r.id === p.id);
        if (!row) return p;
        return {
          ...p,
          home_featured: row.home_featured,
          home_order: row.home_order,
          home_size: row.home_size,
          home_still: row.home_still,
        };
      });
      await onSave({ ...content, projects });
      toast.success("Portada guardada");
    } catch {
      /* onSave already toasts */
    }
  };

  const sorted = [...rows].sort((a, b) => Number(a.home_order) - Number(b.home_order));

  return (
    <div className="border border-white/10 p-6 md:p-8 mb-10" data-testid="admin-home-layout">
      <h2 className="text-xl tracking-tight mb-2">Pantalla principal</h2>
      <p className="text-[12px] text-neutral-500 mb-6 max-w-2xl">
        Elige qué proyectos aparecen en home, el still, el tamaño de la celda y el orden.
        Las imágenes se recortan al frame (sin bandas negras). El showreel se abre desde el menú
        con la URL del bloque Site.
      </p>
      <ul className="space-y-4">
        {sorted.map((row) => {
          const project = content.projects.find((p) => p.id === row.id) || row;
          const thumbs = stillChoices(project);
          return (
            <li
              key={row.id}
              className="rounded-xl border border-white/10 p-4 grid grid-cols-1 lg:grid-cols-[160px_1fr] gap-4"
            >
              <div className="h-24 lg:h-full min-h-[96px] rounded-lg overflow-hidden bg-neutral-900">
                {(row.home_still || row.cover) && (
                  <img
                    src={row.home_still || row.cover}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-white">{row.title}</p>
                  <label className="flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-neutral-400">
                    <input
                      type="checkbox"
                      checked={row.home_featured}
                      onChange={(e) => patch(row.id, { home_featured: e.target.checked })}
                      className="accent-white"
                    />
                    En home
                  </label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Field label="Orden">
                    <input
                      type="number"
                      min={1}
                      className={inputCls}
                      value={row.home_order}
                      onChange={(e) => patch(row.id, { home_order: parseInt(e.target.value, 10) || 1 })}
                    />
                  </Field>
                  <Field label="Tamaño">
                    <select
                      className={inputCls}
                      value={row.home_size}
                      onChange={(e) => patch(row.id, { home_size: e.target.value })}
                    >
                      {HOME_SIZES.map((s) => (
                        <option key={s.id} value={s.id}>{s.es}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                {thumbs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {thumbs.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => patch(row.id, { home_still: url })}
                        className={`h-12 w-[4.5rem] overflow-hidden rounded-md border ${
                          (row.home_still || row.cover) === url
                            ? "border-white"
                            : "border-white/15 hover:border-white/40"
                        }`}
                        title="Usar este still"
                      >
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <button
        data-testid="save-home-layout"
        onClick={handleSave}
        disabled={saving}
        className="mt-6 border border-white/30 px-5 py-2 text-[11px] tracking-[0.28em] uppercase text-white hover:bg-white hover:text-black transition disabled:opacity-50"
      >
        {saving ? "Saving…" : "Guardar portada"}
      </button>
    </div>
  );
};

const SiteSection = ({ content, onSave, saving }) => {
  const [draft, setDraft] = useState(content);
  useEffect(() => setDraft(content), [content]);

  const updSite = (patch) =>
    setDraft({ ...draft, site: { ...draft.site, ...patch } });
  const updI18n = (path, lang, v) => {
    if (path === "about") {
      setDraft({ ...draft, about: { ...draft.about, [lang]: v } });
    } else {
      setDraft({
        ...draft,
        site: {
          ...draft.site,
          [path]: { ...(draft.site[path] || {}), [lang]: v },
        },
      });
    }
  };
  const updSocial = (k, v) =>
    setDraft({
      ...draft,
      site: { ...draft.site, social: { ...draft.site.social, [k]: v } },
    });

  const handleSave = async () => {
    try {
      await onSave(draft);
      toast.success("Saved");
    } catch {
      /* onSave already shows the error toast */
    }
  };

  return (
    <div className="border border-white/10 p-6 md:p-8 mb-10">
      <h2 className="text-xl tracking-tight mb-6">Site</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Name">
          <input
            className={inputCls}
            value={draft.site.name}
            onChange={(e) => updSite({ name: e.target.value })}
          />
        </Field>
        <Field label="Showreel URL (Vimeo o YouTube) — página /showreel">
          <input
            data-testid="site-showreel"
            className={inputCls}
            value={draft.site.showreel_url}
            onChange={(e) => updSite({ showreel_url: e.target.value })}
          />
        </Field>
        <ImageUrlField
          label="About — foto (Cloudinary)"
          testId="site-about-image"
          value={draft.site.about_image || ""}
          onChange={(url) => updSite({ about_image: url })}
          assetType="site"
          placeholder="https://res.cloudinary.com/.../foto.jpg"
        />
        <Field label="About — pie de foto">
          <input
            className={inputCls}
            value={draft.site.about_photo_caption || ""}
            onChange={(e) => updSite({ about_photo_caption: e.target.value })}
            placeholder="Ej: Nave Soviética"
          />
        </Field>
        <Field label="Meta description ES (Google)">
          <textarea
            className={textareaCls + " min-h-[88px]"}
            value={draft.site.meta_description?.es || ""}
            onChange={(e) => updI18n("meta_description", "es", e.target.value)}
            placeholder="Texto biográfico breve para resultados de búsqueda (~150–320 caracteres)"
          />
          <p className="text-[9px] text-neutral-600 mt-1">
            {(draft.site.meta_description?.es || "").length} caracteres
          </p>
        </Field>
        <Field label="Meta description EN (Google)">
          <textarea
            className={textareaCls + " min-h-[88px]"}
            value={draft.site.meta_description?.en || ""}
            onChange={(e) => updI18n("meta_description", "en", e.target.value)}
            placeholder="Short bio for search results (~150–320 characters)"
          />
          <p className="text-[9px] text-neutral-600 mt-1">
            {(draft.site.meta_description?.en || "").length} caracteres
          </p>
        </Field>
        <Field label="Title ES">
          <input
            className={inputCls}
            value={draft.site.title?.es || ""}
            onChange={(e) => updI18n("title", "es", e.target.value)}
          />
        </Field>
        <Field label="Title EN">
          <input
            className={inputCls}
            value={draft.site.title?.en || ""}
            onChange={(e) => updI18n("title", "en", e.target.value)}
          />
        </Field>
        <Field label="Tagline ES">
          <input
            className={inputCls}
            value={draft.site.tagline?.es || ""}
            onChange={(e) => updI18n("tagline", "es", e.target.value)}
          />
        </Field>
        <Field label="Tagline EN">
          <input
            className={inputCls}
            value={draft.site.tagline?.en || ""}
            onChange={(e) => updI18n("tagline", "en", e.target.value)}
          />
        </Field>
        <Field label="Email">
          <input
            className={inputCls}
            value={draft.site.social.email || ""}
            onChange={(e) => updSocial("email", e.target.value)}
          />
        </Field>
        <Field label="Teléfono (ej. +34647005955)">
          <input
            className={inputCls}
            value={draft.site.social.phone || ""}
            onChange={(e) => updSocial("phone", e.target.value)}
            placeholder="+34647005955"
          />
        </Field>
        <Field label="Instagram URL">
          <input
            className={inputCls}
            value={draft.site.social.instagram || ""}
            onChange={(e) => updSocial("instagram", e.target.value)}
          />
        </Field>
        <Field label="Vimeo profile URL">
          <input
            className={inputCls}
            value={draft.site.social.vimeo || ""}
            onChange={(e) => updSocial("vimeo", e.target.value)}
          />
        </Field>
        <Field label="LinkedIn URL">
          <input
            className={inputCls}
            value={draft.site.social.linkedin || ""}
            onChange={(e) => updSocial("linkedin", e.target.value)}
          />
        </Field>
        <Field label="IMDb URL">
          <input
            className={inputCls}
            value={draft.site.social.imdb || ""}
            onChange={(e) => updSocial("imdb", e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="About ES">
          <textarea
            className={textareaCls + " min-h-[180px]"}
            value={draft.about?.es || ""}
            onChange={(e) => updI18n("about", "es", e.target.value)}
          />
        </Field>
        <Field label="About EN">
          <textarea
            className={textareaCls + " min-h-[180px]"}
            value={draft.about?.en || ""}
            onChange={(e) => updI18n("about", "en", e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          data-testid="save-site"
          onClick={handleSave}
          disabled={saving}
          className="border border-white/30 px-5 py-2 text-[11px] tracking-[0.28em] uppercase text-white hover:bg-white hover:text-black transition disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save site"}
        </button>
      </div>
    </div>
  );
};

export default function Admin() {
  const [authed, setAuthed] = useState(isAdminAuthed());
  const [pwd, setPwd] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [content, setContent] = useState(loadContent());
  const [contentLoading, setContentLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(null);
  const fileRef = useRef(null);

  // Fetch fresh content from MongoDB whenever we become authenticated
  useEffect(() => {
    if (!authed) return;
    setContentLoading(true);
    fetchContent()
      .then((serverContent) => {
        if (serverContent) {
          setContent(serverContent);
          saveContent(serverContent);
        }
      })
      .catch(() => toast.error("No se pudo cargar el contenido del servidor"))
      .finally(() => setContentLoading(false));
  }, [authed]);

  const tryLogin = async () => {
    setLoginLoading(true);
    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password: pwd }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setAdminAuthed(true);
        setAuthed(true);
      } else {
        toast.error(data.message || "Contraseña incorrecta");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoginLoading(false);
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="w-full max-w-sm" data-testid="admin-login">
          <Link
            to="/"
            className="text-[11px] tracking-[0.28em] uppercase text-neutral-400 mb-10 inline-block hover:text-white"
          >
            ← Volver
          </Link>
          <h1 className="text-3xl tracking-tight mb-8 font-light text-white">Admin</h1>
          <input
            type="password"
            data-testid="admin-password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") tryLogin();
            }}
            placeholder="Contraseña"
            className={inputCls}
            autoComplete="current-password"
          />
          <button
            data-testid="admin-login-btn"
            type="button"
            onClick={tryLogin}
            disabled={loginLoading}
            className="mt-4 w-full border border-white/30 px-5 py-3 text-[11px] tracking-[0.28em] uppercase text-white hover:bg-white hover:text-black transition disabled:opacity-50"
          >
            {loginLoading ? "Entrando…" : "Entrar"}
          </button>
        </div>
      </div>
    );
  }

  const onSave = async (next) => {
    setSaving(true);
    try {
      await pushContent(next);
      setContent(next);
    } catch (err) {
      toast.error("Error al guardar: " + err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (i) => {
    setEditing(i);
    const draftProject = JSON.parse(JSON.stringify(content.projects[i]));
    draftProject.recognitions = normalizeRecognitions(draftProject.recognitions);
    setDraft(draftProject);
  };
  const startNew = () => {
    setEditing("new");
    setDraft({
      id: newProjectId(),
      slug: "",
      category: "fiction",
      title: "",
      year: new Date().getFullYear(),
      type: { es: "", en: "" },
      director: "",
      production_company: "",
      format: "",
      synopsis: { es: "", en: "" },
      cover: "",
      poster: "",
      preview_url: "",
      stills: [],
      bts: [],
      recognitions: [],
      external_link: "",
      published: true,
      home_featured: true,
      home_order: "",
      home_size: "medium",
      home_still: "",
    });
  };
  const cancelEdit = () => {
    setEditing(null);
    setDraft(null);
  };
  const saveEdit = async () => {
    if (!draft.title || !draft.slug) {
      toast.error("Title and slug required");
      return;
    }
    const next = { ...content, projects: [...content.projects] };
    if (editing === "new") next.projects.push(draft);
    else next.projects[editing] = draft;
    try {
      await onSave(next);
      cancelEdit();
      toast.success("Saved");
    } catch {
      /* onSave already shows the error toast */
    }
  };
  const deleteAt = async (i) => {
    if (!window.confirm("Delete this project?")) return;
    const next = {
      ...content,
      projects: content.projects.filter((_, x) => x !== i),
    };
    try {
      await onSave(next);
      toast.success("Deleted");
    } catch {
      /* onSave already shows the error toast */
    }
  };
  const move = async (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= content.projects.length) return;
    const arr = [...content.projects];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    try {
      await onSave({ ...content, projects: arr });
    } catch {
      /* onSave already shows the error toast */
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(content, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `content-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const importJson = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = async () => {
      try {
        const json = JSON.parse(r.result);
        if (!json.site || !Array.isArray(json.projects))
          throw new Error("Invalid structure");
        await onSave(json);
        toast.success("Imported");
      } catch (err) {
        toast.error("Invalid JSON: " + err.message);
      }
    };
    r.readAsText(f);
    e.target.value = "";
  };
  const reset = async () => {
    if (
      !window.confirm("Reset to default content? All changes will be lost.")
    )
      return;
    try {
      await resetContent();
      const def = getDefaultContent();
      setContent(def);
      toast.success("Reset");
    } catch (err) {
      toast.error("Error al resetear: " + err.message);
    }
  };

  if (contentLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-[11px] tracking-[0.28em] uppercase text-neutral-500">
          Cargando…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white" data-testid="admin-panel">
      <div className="border-b border-white/10 px-6 md:px-12 py-5 flex items-center justify-between sticky top-0 bg-black z-30">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="text-[11px] tracking-[0.28em] uppercase text-neutral-400 hover:text-white"
          >
            ← Site
          </Link>
          <h1 className="text-base tracking-[0.2em] uppercase">Admin</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          <button
            data-testid="admin-export"
            onClick={exportJson}
            className="border border-white/30 px-3 md:px-4 py-2 text-[10px] md:text-[11px] tracking-[0.24em] uppercase text-white hover:bg-white hover:text-black transition"
          >
            Export
          </button>
          <button
            data-testid="admin-import"
            onClick={() => fileRef.current?.click()}
            className="border border-white/30 px-3 md:px-4 py-2 text-[10px] md:text-[11px] tracking-[0.24em] uppercase text-white hover:bg-white hover:text-black transition"
          >
            Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            onChange={importJson}
            className="hidden"
            data-testid="admin-import-input"
          />
          <button
            onClick={reset}
            disabled={saving}
            className="border border-white/20 px-3 md:px-4 py-2 text-[10px] md:text-[11px] tracking-[0.24em] uppercase text-neutral-400 hover:text-white disabled:opacity-50"
          >
            Reset
          </button>
          <button
            data-testid="admin-logout"
            onClick={() => {
              setAdminAuthed(false);
              setAuthed(false);
            }}
            className="text-[10px] md:text-[11px] tracking-[0.24em] uppercase text-neutral-400 hover:text-white ml-2"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="px-6 md:px-12 py-10 max-w-6xl">
        <SiteSection content={content} onSave={onSave} saving={saving} />
        <HomeLayoutSection content={content} onSave={onSave} saving={saving} />

        <div className="border border-white/10 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl tracking-tight">
              Projects ({content.projects.length})
            </h2>
            <button
              data-testid="admin-add-project"
              onClick={startNew}
              className="border border-white/30 px-4 py-2 text-[11px] tracking-[0.24em] uppercase text-white hover:bg-white hover:text-black transition"
            >
              + Add project
            </button>
          </div>

          {editing !== null && draft && (
            <div
              className="border border-white/20 p-5 md:p-6 mb-8 bg-[#0a0a0a]"
              data-testid="admin-project-form"
            >
              <p className="text-[11px] tracking-[0.28em] uppercase text-neutral-400 mb-4">
                {editing === "new" ? "New project" : "Edit project"}
              </p>
              <ProjectForm value={draft} onChange={setDraft} />
              <div className="mt-6 flex gap-3">
                <button
                  data-testid="admin-save-project"
                  onClick={saveEdit}
                  disabled={saving}
                  className="border border-white bg-white text-black px-5 py-2 text-[11px] tracking-[0.28em] uppercase hover:bg-transparent hover:text-white transition disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={cancelEdit}
                  className="border border-white/20 px-5 py-2 text-[11px] tracking-[0.28em] uppercase text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <ul className="divide-y divide-white/10">
            {content.projects.map((p, i) => {
              const videoSeo = getProjectVideoSeoLabel(p);
              return (
              <li
                key={p.id}
                data-testid={`admin-row-${p.slug}`}
                className="py-4 flex items-center gap-4"
              >
                <div className="w-16 h-12 bg-neutral-800 overflow-hidden shrink-0">
                  {p.cover && (
                    <img
                      src={p.cover}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm truncate">{p.title || <em>untitled</em>}</p>
                    {p.published === false && (
                      <span className="shrink-0 text-[9px] tracking-[0.2em] uppercase text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5">
                        Draft
                      </span>
                    )}
                    <span
                      title={videoSeo.title}
                      className={`shrink-0 text-[9px] tracking-[0.18em] uppercase px-1.5 py-0.5 border ${
                        videoSeo.status === "ok"
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : videoSeo.status === "draft"
                            ? "text-neutral-500 bg-neutral-100 border-neutral-200"
                            : "text-neutral-500 bg-neutral-50 border-neutral-200"
                      }`}
                    >
                      {videoSeo.label}
                    </span>
                  </div>
                  <p className="text-[11px] tracking-[0.2em] uppercase text-neutral-400 truncate">
                    {p.category} · {p.year} · {p.director}
                  </p>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={saving}
                    className="px-2 py-1 text-xs text-neutral-400 hover:text-white disabled:opacity-30"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={saving}
                    className="px-2 py-1 text-xs text-neutral-400 hover:text-white disabled:opacity-30"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    data-testid={`admin-edit-${p.slug}`}
                    onClick={() => startEdit(i)}
                    className="border border-white/20 px-3 py-1 text-[10px] tracking-[0.24em] uppercase text-white hover:border-white"
                  >
                    Edit
                  </button>
                  <button
                    data-testid={`admin-delete-${p.slug}`}
                    onClick={() => deleteAt(i)}
                    disabled={saving}
                    className="border border-white/20 px-3 py-1 text-[10px] tracking-[0.24em] uppercase text-red-400 hover:border-red-400 disabled:opacity-30"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
