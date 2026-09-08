import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CATEGORIES, slugify } from "../../lib/contentStore";
import { getVimeoPosterUrl } from "../../lib/vimeo";
import { uploadImageFile, cloudinaryFolderHint } from "../../lib/uploadImage";
import { ImageDropZone, handleTextareaImagePaste } from "../../components/admin/ImageDropZone";
import { mergeRecognitionUrls, normalizeRecognitions } from "../../lib/recognitions";
import { ChevronDown, ChevronUp } from "lucide-react";
import { HOME_SIZES, stillChoices } from "../../lib/homeGrid";
import { CropEditor } from "../../components/admin/CropEditor";
import { SHOWREEL_PLACEMENTS } from "../../lib/crop";
import { fetchVimeoMeta, isVimeoUrl as isVimeoPreviewUrl } from "../../lib/vimeoMeta";
import { Field } from "./fields/Field";
import { ImageUrlField } from "./fields/ImageUrlField";
import { UrlListField } from "./fields/UrlListField";
import { RecognitionsField } from "./fields/RecognitionsField";
import { inputCls, textareaCls } from "./styles";
import { projectVimeoPreview, previewCropGuideUrl } from "./lib/previewHelpers";

export const ProjectForm = ({ value, onChange }) => {
  const update = (patch) => onChange({ ...value, ...patch });
  const updateI18n = (key, lang, v) =>
    onChange({ ...value, [key]: { ...(value[key] || {}), [lang]: v } });
  const projectSlug = value.slug || slugify(value.title || "");
  const [ratioStatus, setRatioStatus] = useState("idle");
  const ratioRequestRef = useRef(0);
  const ensureSlug = () => {
    if (!value.slug && projectSlug) update({ slug: projectSlug });
  };

  const resolvePreviewRatio = async (url, { force = false } = {}) => {
    const trimmed = String(url || "").trim();
    if (!trimmed) {
      setRatioStatus("idle");
      update({ preview_url: "", preview_video_ratio: undefined });
      return;
    }

    if (!isVimeoPreviewUrl(trimmed)) {
      setRatioStatus("idle");
      update({ preview_url: trimmed, preview_video_ratio: undefined });
      return;
    }

    const requestId = ++ratioRequestRef.current;
    setRatioStatus("loading");

    try {
      const meta = await fetchVimeoMeta(trimmed);
      if (requestId !== ratioRequestRef.current) return;

      update({
        preview_url: trimmed,
        preview_video_ratio: meta?.aspect_ratio ?? undefined,
      });
      setRatioStatus(meta?.aspect_ratio ? "ok" : "error");
    } catch {
      if (requestId !== ratioRequestRef.current) return;
      update({ preview_url: trimmed });
      setRatioStatus("error");
    }
  };

  useEffect(() => {
    const url = String(value.preview_url || "").trim();
    if (!url) {
      setRatioStatus("idle");
      return undefined;
    }
    if (!isVimeoPreviewUrl(url)) {
      setRatioStatus("idle");
      return undefined;
    }
    if (typeof value.preview_video_ratio === "number" && value.preview_video_ratio > 0) {
      setRatioStatus("ok");
      return undefined;
    }

    const timer = window.setTimeout(() => {
      resolvePreviewRatio(url);
    }, 450);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.preview_url, value.preview_video_ratio]);

  const ratioLabel =
    ratioStatus === "loading"
      ? "Calculando ratio del vídeo…"
      : ratioStatus === "ok" && typeof value.preview_video_ratio === "number"
        ? `Ratio detectado: ${value.preview_video_ratio.toFixed(3)} (${Math.round(value.preview_video_ratio * 1000) / 1000}:1)`
        : ratioStatus === "error"
          ? "No se pudo resolver el ratio de Vimeo. Se usará 16:9 al mostrar la miniatura."
          : projectVimeoPreview(value) && typeof value.preview_video_ratio !== "number"
            ? "Ratio pendiente de calcular."
            : "";

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
          onChange={(e) => {
            const nextUrl = e.target.value;
            update({
              preview_url: nextUrl,
              preview_video_ratio: undefined,
            });
            if (!nextUrl.trim()) setRatioStatus("idle");
            else if (!isVimeoPreviewUrl(nextUrl.trim())) setRatioStatus("idle");
            else setRatioStatus("loading");
          }}
          placeholder="https://vimeo.com/... o https://youtube.com/watch?v=..."
        />
        <p className="mt-1 text-[11px] text-neutral-500">
          Con URL de vídeo, la página del proyecto se indexa automáticamente como watch page en Google.
          En Obra el vídeo se autoreproduce en la miniatura; en la portada, al pasar el ratón.
        </p>
        {projectVimeoPreview(value) && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {ratioLabel && (
              <p
                className={`text-[11px] ${
                  ratioStatus === "error" ? "text-amber-400" : "text-neutral-500"
                }`}
              >
                {ratioLabel}
              </p>
            )}
            <button
              type="button"
              className="border border-white/20 px-2.5 py-1 text-[10px] tracking-[0.18em] uppercase text-white/80 hover:bg-white hover:text-black transition disabled:opacity-40"
              disabled={ratioStatus === "loading"}
              onClick={() => resolvePreviewRatio(value.preview_url, { force: true })}
            >
              Recalcular ratio
            </button>
          </div>
        )}
      </Field>
      {projectVimeoPreview(value) && (
        <div className="md:col-span-2 rounded-xl border border-white/10 p-4 space-y-3">
          <p className="text-[10px] tracking-[0.28em] uppercase text-neutral-500">
            Reencuadre del vídeo Vimeo (16:9)
          </p>
          <p className="text-[11px] text-neutral-500 max-w-2xl">
            Define qué parte del vídeo se ve en las miniaturas de Obra y en el preview al hover en
            la portada. La imagen de referencia es el thumbnail de Vimeo; no modifica el still de la
            parrilla.
          </p>
          <CropEditor
            label="Ventana visible en miniatura"
            imageUrl={previewCropGuideUrl(value)}
            crop={value.preview_crop ?? value.work_crop}
            onChange={(preview_crop) => update({ preview_crop })}
            mode="16:9"
          />
        </div>
      )}
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
          <p className="mt-2 text-[11px] text-neutral-500">
            Portada (orden, tamaño, still): sección «Pantalla principal» más abajo en Admin.
          </p>
        </Field>
      </div>
    </div>
  );
};
