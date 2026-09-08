import { useMemo } from "react";
import { ImageUrlField } from "./fields/ImageUrlField";
import { Field } from "./fields/Field";
import { I18nField, ValidatedField, inputCls, textareaCls } from "./ValidatedField";
import { AdminSection } from "./AdminSection";
import { SaveStatus } from "./SaveStatus";
import { useAdminContent } from "./hooks/useAdminContent";
import { useSectionDraft } from "./hooks/useSectionDraft";
import { validateSite } from "./lib/projectValidation";

export const SiteSection = () => {
  const { content, saveSite, saveStates, reload } = useAdminContent();
  const initial = useMemo(() => ({ site: content.site, about: content.about }), [content.about, content.site]);
  const { draft, setDraft, status } = useSectionDraft({
    initial,
    debounceMs: 1800,
    onSave: (next) => saveSite({ site: next.site, about: next.about }),
  });
  const errors = validateSite(draft.site);
  const updSite = (patch) => setDraft({ ...draft, site: { ...draft.site, ...patch } });
  const updI18n = (path, lang, v) => {
    if (path === "about") setDraft({ ...draft, about: { ...draft.about, [lang]: v } });
    else setDraft({ ...draft, site: { ...draft.site, [path]: { ...(draft.site[path] || {}), [lang]: v } } });
  };
  const updSocial = (k, v) =>
    setDraft({ ...draft, site: { ...draft.site, social: { ...draft.site.social, [k]: v } } });

  return (
    <AdminSection
      title="Información del sitio"
      description="Identidad, about, SEO y contacto. El showreel se edita en Pantalla principal."
      actions={<SaveStatus saveState={status === "dirty" ? "idle" : status === "saving" ? "saving" : saveStates.site} onReload={reload} lastSavedAt={status === "saved" ? new Date() : null} />}
    >
      <h3 className="text-[11px] tracking-[0.24em] uppercase text-neutral-500 mb-4">Identidad</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        <Field label="Nombre">
          <input className={inputCls} value={draft.site.name || ""} onChange={(e) => updSite({ name: e.target.value })} />
        </Field>
        <I18nField label="Título" es={draft.site.title?.es} en={draft.site.title?.en} onChangeEs={(v) => updI18n("title", "es", v)} onChangeEn={(v) => updI18n("title", "en", v)} />
        <I18nField label="Tagline" es={draft.site.tagline?.es} en={draft.site.tagline?.en} onChangeEs={(v) => updI18n("tagline", "es", v)} onChangeEn={(v) => updI18n("tagline", "en", v)} />
        <ImageUrlField label="Logo blanco" value={draft.site.logo_white || ""} onChange={(url) => updSite({ logo_white: url })} assetType="site" />
      </div>

      <h3 className="text-[11px] tracking-[0.24em] uppercase text-neutral-500 mb-4">About</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        <ImageUrlField label="Foto" testId="site-about-image" value={draft.site.about_image || ""} onChange={(url) => updSite({ about_image: url })} assetType="site" />
        <Field label="Pie de foto">
          <input className={inputCls} value={draft.site.about_photo_caption || ""} onChange={(e) => updSite({ about_photo_caption: e.target.value })} />
        </Field>
        <I18nField multiline label="Texto" es={draft.about?.es} en={draft.about?.en} onChangeEs={(v) => updI18n("about", "es", v)} onChangeEn={(v) => updI18n("about", "en", v)} />
      </div>

      <h3 className="text-[11px] tracking-[0.24em] uppercase text-neutral-500 mb-4">SEO</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        <ValidatedField label="Meta description ES" counter={(draft.site.meta_description?.es || "").length}>
          <textarea className={textareaCls} value={draft.site.meta_description?.es || ""} onChange={(e) => updI18n("meta_description", "es", e.target.value)} />
        </ValidatedField>
        <ValidatedField label="Meta description EN" counter={(draft.site.meta_description?.en || "").length}>
          <textarea className={textareaCls} value={draft.site.meta_description?.en || ""} onChange={(e) => updI18n("meta_description", "en", e.target.value)} />
        </ValidatedField>
      </div>

      <h3 className="text-[11px] tracking-[0.24em] uppercase text-neutral-500 mb-4">Contacto</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ValidatedField label="Email" error={errors.email}>
          <input className={inputCls} value={draft.site.social?.email || ""} onChange={(e) => updSocial("email", e.target.value)} />
        </ValidatedField>
        <ValidatedField label="Teléfono" error={errors.phone}>
          <input className={inputCls} value={draft.site.social?.phone || ""} onChange={(e) => updSocial("phone", e.target.value)} />
        </ValidatedField>
        {["instagram", "vimeo", "linkedin", "imdb"].map((key) => (
          <Field key={key} label={key}>
            <input className={inputCls} value={draft.site.social?.[key] || ""} onChange={(e) => updSocial(key, e.target.value)} />
          </Field>
        ))}
      </div>
    </AdminSection>
  );
};
