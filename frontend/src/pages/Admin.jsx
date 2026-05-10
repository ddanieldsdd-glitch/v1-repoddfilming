import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  loadContent,
  saveContent,
  resetContent,
  ADMIN_PASSWORD,
  isAdminLoginConfigured,
  isAdminAuthed,
  setAdminAuthed,
  CATEGORIES,
  slugify,
  newProjectId,
  getDefaultContent,
} from "../lib/contentStore";

const Field = ({ label, children }) => (
  <label className="block">
    <span className="block text-[10px] tracking-[0.28em] uppercase text-neutral-500 mb-2">
      {label}
    </span>
    {children}
  </label>
);

const inputCls =
  "w-full border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white";

const textareaCls = inputCls + " min-h-[90px] resize-y";

const ProjectForm = ({ value, onChange }) => {
  const update = (patch) => onChange({ ...value, ...patch });
  const updateI18n = (key, lang, v) =>
    onChange({ ...value, [key]: { ...(value[key] || {}), [lang]: v } });

  const updateList = (key, v) =>
    onChange({
      ...value,
      [key]: v
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    });

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
      <Field label="Cover image URL">
        <input
          data-testid="form-cover"
          className={inputCls}
          value={value.cover || ""}
          onChange={(e) => update({ cover: e.target.value })}
        />
      </Field>
      <Field label="Video embed / preview URL (Vimeo or YouTube)">
        <input
          data-testid="form-preview"
          className={inputCls}
          value={value.preview_url || ""}
          onChange={(e) => update({ preview_url: e.target.value })}
          placeholder="https://vimeo.com/..."
        />
      </Field>
      <Field label="Poster image URL (optional)">
        <input
          data-testid="form-poster"
          className={inputCls}
          value={value.poster || ""}
          onChange={(e) => update({ poster: e.target.value })}
        />
      </Field>
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
      <Field label="Stills URLs (one per line)">
        <textarea
          data-testid="form-stills"
          className={textareaCls}
          value={(value.stills || []).join("\n")}
          onChange={(e) => updateList("stills", e.target.value)}
        />
      </Field>
      <Field label="BTS URLs (one per line)">
        <textarea
          className={textareaCls}
          value={(value.bts || []).join("\n")}
          onChange={(e) => updateList("bts", e.target.value)}
        />
      </Field>
    </div>
  );
};

const SiteSection = ({ content, onSave }) => {
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

  return (
    <div className="border border-black/10 p-6 md:p-8 mb-10">
      <h2 className="text-xl tracking-tight mb-6">Site</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Name">
          <input
            className={inputCls}
            value={draft.site.name}
            onChange={(e) => updSite({ name: e.target.value })}
          />
        </Field>
        <Field label="Showreel URL (Vimeo)">
          <input
            data-testid="site-showreel"
            className={inputCls}
            value={draft.site.showreel_url}
            onChange={(e) => updSite({ showreel_url: e.target.value })}
          />
        </Field>
        <Field label="About photo URL (shown on /about)">
          <input
            data-testid="site-about-image"
            className={inputCls}
            value={draft.site.about_image || ""}
            onChange={(e) => updSite({ about_image: e.target.value })}
          />
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
          onClick={() => {
            onSave(draft);
            toast.success("Saved");
          }}
          className="border border-black px-5 py-2 text-[11px] tracking-[0.28em] uppercase hover:bg-black hover:text-white transition"
        >
          Save site
        </button>
      </div>
    </div>
  );
};

export default function Admin() {
  const [authed, setAuthed] = useState(isAdminAuthed());
  const [pwd, setPwd] = useState("");
  const [content, setContent] = useState(loadContent());
  const [editing, setEditing] = useState(null); // index or 'new'
  const [draft, setDraft] = useState(null);
  const fileRef = useRef(null);

  const onSave = (next) => {
    saveContent(next);
    setContent(next);
  };

  const tryLogin = () => {
    if (!isAdminLoginConfigured()) {
      toast.error("Admin no configurado en este entorno");
      return;
    }
    if (pwd === ADMIN_PASSWORD) {
      setAdminAuthed(true);
      setAuthed(true);
    } else toast.error("Contraseña incorrecta");
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-sm" data-testid="admin-login">
          <Link to="/" className="text-[11px] tracking-[0.28em] uppercase text-neutral-500 mb-10 inline-block">
            ← Volver
          </Link>
          <h1 className="text-3xl tracking-tight mb-8 font-light">Admin</h1>
          {!isAdminLoginConfigured() ? (
            <p className="text-sm text-neutral-600 leading-relaxed">
              El panel no está activo en esta versión pública. Para usarlo en producción,
              define la variable <code className="text-xs bg-neutral-100 px-1">REACT_APP_ADMIN_PASSWORD</code> en
              Vercel y vuelve a desplegar.
            </p>
          ) : (
            <>
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
                className="mt-4 w-full border border-black px-5 py-3 text-[11px] tracking-[0.28em] uppercase hover:bg-black hover:text-white transition"
              >
                Entrar
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const startEdit = (i) => {
    setEditing(i);
    setDraft(JSON.parse(JSON.stringify(content.projects[i])));
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
      external_link: "",
    });
  };
  const cancelEdit = () => {
    setEditing(null);
    setDraft(null);
  };
  const saveEdit = () => {
    if (!draft.title || !draft.slug) {
      toast.error("Title and slug required");
      return;
    }
    const next = { ...content, projects: [...content.projects] };
    if (editing === "new") next.projects.push(draft);
    else next.projects[editing] = draft;
    onSave(next);
    cancelEdit();
    toast.success("Saved");
  };
  const deleteAt = (i) => {
    if (!window.confirm("Delete this project?")) return;
    const next = { ...content, projects: content.projects.filter((_, x) => x !== i) };
    onSave(next);
    toast.success("Deleted");
  };
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= content.projects.length) return;
    const arr = [...content.projects];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onSave({ ...content, projects: arr });
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
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
    r.onload = () => {
      try {
        const json = JSON.parse(r.result);
        if (!json.site || !Array.isArray(json.projects))
          throw new Error("Invalid structure");
        onSave(json);
        toast.success("Imported");
      } catch (err) {
        toast.error("Invalid JSON: " + err.message);
      }
    };
    r.readAsText(f);
    e.target.value = "";
  };
  const reset = () => {
    if (!window.confirm("Reset to default content? Local changes will be lost.")) return;
    resetContent();
    setContent(getDefaultContent());
    toast.success("Reset");
  };

  return (
    <div className="min-h-screen bg-white" data-testid="admin-panel">
      <div className="border-b border-black/10 px-6 md:px-12 py-5 flex items-center justify-between sticky top-0 bg-white z-30">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-[11px] tracking-[0.28em] uppercase text-neutral-500 hover:text-black">
            ← Site
          </Link>
          <h1 className="text-base tracking-[0.2em] uppercase">Admin</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          <button
            data-testid="admin-export"
            onClick={exportJson}
            className="border border-black px-3 md:px-4 py-2 text-[10px] md:text-[11px] tracking-[0.24em] uppercase hover:bg-black hover:text-white transition"
          >
            Export
          </button>
          <button
            data-testid="admin-import"
            onClick={() => fileRef.current?.click()}
            className="border border-black px-3 md:px-4 py-2 text-[10px] md:text-[11px] tracking-[0.24em] uppercase hover:bg-black hover:text-white transition"
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
            className="border border-black/40 px-3 md:px-4 py-2 text-[10px] md:text-[11px] tracking-[0.24em] uppercase text-neutral-600 hover:text-black"
          >
            Reset
          </button>
          <button
            data-testid="admin-logout"
            onClick={() => {
              setAdminAuthed(false);
              setAuthed(false);
            }}
            className="text-[10px] md:text-[11px] tracking-[0.24em] uppercase text-neutral-500 hover:text-black ml-2"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="px-6 md:px-12 py-10 max-w-6xl">
        <SiteSection content={content} onSave={onSave} />

        <div className="border border-black/10 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl tracking-tight">
              Projects ({content.projects.length})
            </h2>
            <button
              data-testid="admin-add-project"
              onClick={startNew}
              className="border border-black px-4 py-2 text-[11px] tracking-[0.24em] uppercase hover:bg-black hover:text-white transition"
            >
              + Add project
            </button>
          </div>

          {editing !== null && draft && (
            <div className="border border-black p-5 md:p-6 mb-8 bg-neutral-50" data-testid="admin-project-form">
              <p className="text-[11px] tracking-[0.28em] uppercase text-neutral-500 mb-4">
                {editing === "new" ? "New project" : "Edit project"}
              </p>
              <ProjectForm value={draft} onChange={setDraft} />
              <div className="mt-6 flex gap-3">
                <button
                  data-testid="admin-save-project"
                  onClick={saveEdit}
                  className="border border-black bg-black text-white px-5 py-2 text-[11px] tracking-[0.28em] uppercase hover:bg-white hover:text-black transition"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="border border-black/30 px-5 py-2 text-[11px] tracking-[0.28em] uppercase text-neutral-600 hover:text-black"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <ul className="divide-y divide-black/10">
            {content.projects.map((p, i) => (
              <li
                key={p.id}
                data-testid={`admin-row-${p.slug}`}
                className="py-4 flex items-center gap-4"
              >
                <div className="w-16 h-12 bg-neutral-100 overflow-hidden shrink-0">
                  {p.cover && (
                    <img src={p.cover} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{p.title || <em>untitled</em>}</p>
                  <p className="text-[11px] tracking-[0.2em] uppercase text-neutral-500 truncate">
                    {p.category} · {p.year} · {p.director}
                  </p>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <button
                    onClick={() => move(i, -1)}
                    className="px-2 py-1 text-xs text-neutral-500 hover:text-black"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    className="px-2 py-1 text-xs text-neutral-500 hover:text-black"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    data-testid={`admin-edit-${p.slug}`}
                    onClick={() => startEdit(i)}
                    className="border border-black/30 px-3 py-1 text-[10px] tracking-[0.24em] uppercase hover:border-black"
                  >
                    Edit
                  </button>
                  <button
                    data-testid={`admin-delete-${p.slug}`}
                    onClick={() => deleteAt(i)}
                    className="border border-black/30 px-3 py-1 text-[10px] tracking-[0.24em] uppercase text-red-600 hover:border-red-600"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
