import { useEffect, useRef, useState } from "react";
import { CATEGORIES, slugify } from "../../lib/contentStore";
import { CropEditor } from "../../components/admin/CropEditor";
import { fetchVimeoMeta, isVimeoUrl as isVimeoPreviewUrl } from "../../lib/vimeoMeta";
import { Field } from "./fields/Field";
import { ImageUrlField } from "./fields/ImageUrlField";
import { UrlListField } from "./fields/UrlListField";
import { RecognitionsField } from "./fields/RecognitionsField";
import { I18nField, ValidatedField, inputCls } from "./ValidatedField";
import { projectVimeoPreview, previewCropGuideUrl } from "./lib/previewHelpers";

const Block = ({ title, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <section className="md:col-span-2 border border-white/10 p-4">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex justify-between text-[11px] tracking-[0.22em] uppercase text-neutral-400 mb-4">
        {title}
        <span>{open ? "−" : "+"}</span>
      </button>
      {open && <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>}
    </section>
  );
};

export const ProjectForm = ({ value, onChange, errors = {} }) => {
  const update = (patch) => onChange({ ...value, ...patch });
  const updateI18n = (key, lang, v) =>
    onChange({ ...value, [key]: { ...(value[key] || {}), [lang]: v } });
  const projectSlug = value.slug || slugify(value.title || "");
  const [ratioStatus, setRatioStatus] = useState("idle");
  const ratioRequestRef = useRef(0);
  const ensureSlug = () => {
    if (!value.slug && projectSlug) update({ slug: projectSlug });
  };

  const resolvePreviewRatio = async (url) => {
    const trimmed = String(url || "").trim();
    if (!trimmed || !isVimeoPreviewUrl(trimmed)) {
      setRatioStatus("idle");
      update({ preview_url: trimmed, preview_video_ratio: undefined });
      return;
    }
    const requestId = ++ratioRequestRef.current;
    setRatioStatus("loading");
    try {
      const meta = await fetchVimeoMeta(trimmed);
      if (requestId !== ratioRequestRef.current) return;
      update({ preview_url: trimmed, preview_video_ratio: meta?.aspect_ratio ?? undefined });
      setRatioStatus(meta?.aspect_ratio ? "ok" : "error");
    } catch {
      if (requestId !== ratioRequestRef.current) return;
      update({ preview_url: trimmed });
      setRatioStatus("error");
    }
  };

  useEffect(() => {
    const url = String(value.preview_url || "").trim();
    if (!isVimeoPreviewUrl(url) || (typeof value.preview_video_ratio === "number" && value.preview_video_ratio > 0)) {
      return undefined;
    }
    const timer = window.setTimeout(() => resolvePreviewRatio(url), 450);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.preview_url, value.preview_video_ratio]);

  return (
    <div className="space-y-5" data-testid="admin-project-form">
      {!projectSlug && (
        <p className="text-[12px] text-amber-400">Completa título y slug para poder subir imágenes.</p>
      )}
      <Block title="Básico">
        <ValidatedField label="Título" error={errors.title}>
          <input data-testid="form-title" className={inputCls} value={value.title || ""} onChange={(e) => update({ title: e.target.value, slug: value.slug || slugify(e.target.value) })} />
        </ValidatedField>
        <ValidatedField label="Slug" error={errors.slug}>
          <input data-testid="form-slug" className={inputCls} value={value.slug || ""} onChange={(e) => update({ slug: slugify(e.target.value) })} />
        </ValidatedField>
        <Field label="Categoría">
          <select data-testid="form-category" className={inputCls} value={value.category || "fiction"} onChange={(e) => update({ category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.es}</option>)}
          </select>
        </Field>
        <ValidatedField label="Año" error={errors.year}>
          <input data-testid="form-year" type="number" className={inputCls} value={value.year || ""} onChange={(e) => update({ year: parseInt(e.target.value, 10) || "" })} />
        </ValidatedField>
        <Field label="Dirección"><input className={inputCls} value={value.director || ""} onChange={(e) => update({ director: e.target.value })} /></Field>
        <Field label="Productora"><input className={inputCls} value={value.production_company || ""} onChange={(e) => update({ production_company: e.target.value })} /></Field>
        <Field label="Formato"><input className={inputCls} value={value.format || ""} onChange={(e) => update({ format: e.target.value })} /></Field>
        <I18nField label="Tipo" es={value.type?.es} en={value.type?.en} onChangeEs={(v) => updateI18n("type", "es", v)} onChangeEn={(v) => updateI18n("type", "en", v)} />
      </Block>

      <Block title="Vídeo y portada del proyecto">
        <ImageUrlField label="Cover" testId="form-cover" value={value.cover || ""} onChange={(url) => update({ cover: url })} projectSlug={projectSlug} assetType="cover" onUploadStart={ensureSlug} />
        <ValidatedField label="URL de preview" error={errors.preview_url} hint="Vimeo o YouTube. En Obra se autoreproduce; en portada, al hover.">
          <input
            data-testid="form-preview"
            className={inputCls}
            value={value.preview_url || ""}
            onChange={(e) => {
              update({ preview_url: e.target.value, preview_video_ratio: undefined });
              setRatioStatus(isVimeoPreviewUrl(e.target.value) ? "loading" : "idle");
            }}
          />
        </ValidatedField>
        {projectVimeoPreview(value) && (
          <div className="md:col-span-2 space-y-3">
            <p className="text-[11px] text-neutral-500">
              {ratioStatus === "ok" && value.preview_video_ratio
                ? `Ratio detectado: ${value.preview_video_ratio.toFixed(3)}`
                : ratioStatus === "error"
                  ? "No se pudo resolver el ratio. Se usará 16:9."
                  : "Ratio pendiente de calcular."}
            </p>
            <button type="button" className="border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.18em]" onClick={() => resolvePreviewRatio(value.preview_url)}>
              Recalcular ratio
            </button>
            <CropEditor label="Ventana visible en miniatura" imageUrl={previewCropGuideUrl(value)} crop={value.preview_crop ?? value.work_crop} onChange={(preview_crop) => update({ preview_crop })} mode="16:9" />
          </div>
        )}
        <ImageUrlField label="Póster" testId="form-poster" value={value.poster || ""} onChange={(url) => update({ poster: url })} projectSlug={projectSlug} assetType="poster" onUploadStart={ensureSlug} />
        <ValidatedField label="Enlace externo" error={errors.external_link}>
          <input className={inputCls} value={value.external_link || ""} onChange={(e) => update({ external_link: e.target.value })} />
        </ValidatedField>
      </Block>

      <Block title="Textos">
        <I18nField multiline label="Sinopsis" es={value.synopsis?.es} en={value.synopsis?.en} onChangeEs={(v) => updateI18n("synopsis", "es", v)} onChangeEn={(v) => updateI18n("synopsis", "en", v)} />
      </Block>

      <Block title="Stills / BTS">
        <UrlListField label="Stills" urls={value.stills || []} onChange={(next) => update({ stills: next })} projectSlug={projectSlug} assetType="stills" onUploadStart={ensureSlug} />
        <UrlListField label="BTS" urls={value.bts || []} onChange={(next) => update({ bts: next })} projectSlug={projectSlug} assetType="bts" onUploadStart={ensureSlug} />
      </Block>

      <Block title="Reconocimientos">
        <div className="md:col-span-2">
          <RecognitionsField items={value.recognitions || []} onChange={(next) => update({ recognitions: next })} projectSlug={projectSlug} onUploadStart={ensureSlug} />
        </div>
      </Block>

      <Block title="Publicación">
        <Field label="Visibilidad">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="accent-white w-4 h-4" checked={value.published !== false} onChange={(e) => update({ published: e.target.checked })} />
            <span>Publicado — visible en el sitio</span>
          </label>
        </Field>
      </Block>
    </div>
  );
};
