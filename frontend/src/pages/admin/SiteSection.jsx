import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Field } from "./fields/Field";
import { ImageUrlField } from "./fields/ImageUrlField";
import { inputCls, textareaCls } from "./styles";
import { SHOWREEL_PLACEMENTS } from "../../lib/crop";

export const SiteSection = ({ content, onSave, saving }) => {
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
      await onSave({ site: draft.site, about: draft.about });
      toast.success("Sitio guardado");
    } catch {
      /* parent handles errors */
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
        <Field label="Dónde mostrar el showreel">
          <select
            className={inputCls}
            value={draft.site.showreel_placement || "nav"}
            onChange={(e) => updSite({ showreel_placement: e.target.value })}
            data-testid="site-showreel-placement"
          >
            {SHOWREEL_PLACEMENTS.map((p) => (
              <option key={p.id} value={p.id}>{p.es}</option>
            ))}
          </select>
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
