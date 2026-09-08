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
  newProjectId,
  getDefaultContent,
  saveContent,
  createProject,
  updateProject,
  deleteProject,
  reorderProjects,
  updateSite,
  updateHomeLayout,
  ContentConflictError,
} from "../lib/contentStore";
import { normalizeRecognitions } from "../lib/recognitions";
import { SiteSection } from "./admin/SiteSection";
import { HomeLayoutSection } from "./admin/HomeLayoutSection";
import { ProjectList } from "./admin/ProjectList";
import { SaveStatus } from "./admin/SaveStatus";
import { fetchVimeoMeta } from "../lib/vimeoMeta";
import { inputCls } from "./admin/styles";

export default function Admin() {
  const [authed, setAuthed] = useState(isAdminAuthed());
  const [pwd, setPwd] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [content, setContent] = useState(loadContent());
  const [contentLoading, setContentLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(null);
  const fileRef = useRef(null);

  const reloadContent = async () => {
    setContentLoading(true);
    try {
      const serverContent = await fetchContent();
      setContent(serverContent);
      setSaveState("idle");
      toast.success("Contenido recargado");
    } catch {
      toast.error("No se pudo recargar el contenido");
    } finally {
      setContentLoading(false);
    }
  };

  useEffect(() => {
    if (!authed) return;
    reloadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  const runSave = async (action, successMessage) => {
    setSaving(true);
    setSaveState("saving");
    try {
      const next = await action();
      setContent(next);
      setSaveState("saved");
      setLastSavedAt(new Date());
      if (successMessage) toast.success(successMessage);
      return next;
    } catch (err) {
      if (err instanceof ContentConflictError) {
        setSaveState("conflict");
        toast.error("Este contenido se modificó en otra sesión. Recarga antes de guardar.");
      } else {
        setSaveState("error");
        toast.error("Error al guardar: " + err.message);
      }
      throw err;
    } finally {
      setSaving(false);
    }
  };

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
      preview_crop: { x: 0, y: 0, w: 1, h: 1 },
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
    try {
      if (editing === "new") {
        await runSave(() => createProject(content, draft, { position: "start" }), "Proyecto creado");
      } else {
        await runSave(() => updateProject(content, draft), "Proyecto guardado");
      }
      cancelEdit();
    } catch {
      /* handled in runSave */
    }
  };

  const deleteAt = async (i) => {
    const project = content.projects[i];
    try {
      await runSave(() => deleteProject(content, project), "Proyecto eliminado");
    } catch {
      /* handled in runSave */
    }
  };

  const move = async (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= content.projects.length) return;
    const arr = [...content.projects];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    try {
      await runSave(
        () => reorderProjects(content, arr.map((project) => project.id)),
        "Orden actualizado",
      );
    } catch {
      /* handled in runSave */
    }
  };

  const recalculateRatio = async (project, index) => {
    try {
      const meta = await fetchVimeoMeta(project.preview_url);
      const nextProject = {
        ...content.projects[index],
        preview_video_ratio: meta?.aspect_ratio ?? undefined,
      };
      await runSave(() => updateProject(content, nextProject), "Ratio actualizado");
    } catch (err) {
      toast.error(err.message || "No se pudo recalcular el ratio");
    }
  };

  const saveSite = async ({ site, about }) =>
    runSave(() => updateSite(content, { site, about }), "Sitio guardado");

  const saveHomeLayout = async ({ home_max, projects }) =>
    runSave(() => updateHomeLayout(content, { home_max, projects }), "Portada guardada");

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
        if (!json.site || !Array.isArray(json.projects)) throw new Error("Invalid structure");
        await runSave(() => pushContent({ ...json, updated_at: content.updated_at }), "Importado");
      } catch (err) {
        toast.error("Invalid JSON: " + err.message);
      }
    };
    r.readAsText(f);
    e.target.value = "";
  };

  const reset = async () => {
    if (!window.confirm("Reset to default content? All changes will be lost.")) return;
    try {
      await resetContent();
      const def = getDefaultContent();
      setContent(def);
      saveContent(def);
      setSaveState("saved");
      setLastSavedAt(new Date());
      toast.success("Reset");
    } catch (err) {
      toast.error("Error al resetear: " + err.message);
    }
  };

  if (contentLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-[11px] tracking-[0.28em] uppercase text-neutral-500">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white" data-testid="admin-panel">
      <div className="border-b border-white/10 px-6 md:px-12 py-5 flex items-center justify-between sticky top-0 bg-black z-30 gap-4">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="text-[11px] tracking-[0.28em] uppercase text-neutral-400 hover:text-white"
          >
            ← Site
          </Link>
          <h1 className="text-base tracking-[0.2em] uppercase">Admin</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end">
          <SaveStatus
            saveState={saveState}
            lastSavedAt={lastSavedAt}
            onReload={reloadContent}
          />
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
        <SiteSection content={content} onSave={saveSite} saving={saving} />
        <HomeLayoutSection content={content} onSave={saveHomeLayout} saving={saving} />
        <ProjectList
          projects={content.projects}
          saving={saving}
          editing={editing}
          draft={draft}
          onStartNew={startNew}
          onStartEdit={startEdit}
          onCancelEdit={cancelEdit}
          onSaveEdit={saveEdit}
          onDelete={deleteAt}
          onMove={move}
          onDraftChange={setDraft}
          onRecalculateRatio={recalculateRatio}
        />
      </div>
    </div>
  );
}
