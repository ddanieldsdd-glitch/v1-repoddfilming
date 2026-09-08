import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { newProjectId } from "../../lib/contentStore";
import { useAdminContent } from "./hooks/useAdminContent";
import { ProjectForm } from "./ProjectForm";
import { AdminButton } from "./AdminButton";
import { AdminSection } from "./AdminSection";
import { AdminDialog } from "./AdminDialog";
import { validateProject } from "./lib/projectValidation";
import { clearProjectDraft, loadProjectDraft, saveProjectDraft } from "./lib/projectDraft";

const emptyProject = () => ({
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
  preview_crop: { x: 0, y: 0, w: 1, h: 1 },
});

export const ProjectEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { content, saveNewProject, saveProject, saveStates } = useAdminContent();
  const isNew = !id || id === "new";
  const existing = content.projects.find((project) => project.id === id);
  const draftKey = isNew ? "new" : id;
  const initial = useMemo(() => existing || emptyProject(), [existing]);
  const [draft, setDraft] = useState(initial);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const errors = validateProject(draft, content.projects);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  useEffect(() => {
    const stored = loadProjectDraft(draftKey);
    if (stored?.project) setDraft(stored.project);
    else setDraft(initial);
  }, [draftKey, initial]);

  useEffect(() => {
    if (dirty) saveProjectDraft(draftKey, { project: draft });
  }, [dirty, draft, draftKey]);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    const onUnload = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [dirty]);

  const handleSave = async () => {
    if (Object.keys(errors).length) {
      toast.error(Object.values(errors)[0]);
      return;
    }
    if (isNew) await saveNewProject(draft);
    else await saveProject(draft);
    clearProjectDraft(draftKey);
    navigate("/admin/projects");
  };

  if (!isNew && !existing) {
    return <p className="text-neutral-500">Proyecto no encontrado.</p>;
  }

  return (
    <AdminSection
      title={isNew ? "Nuevo proyecto" : draft.title || "Editar proyecto"}
      description="Guarda de forma explícita. Los cambios se conservan en esta sesión si sales por error."
      actions={
        <div className="flex items-center gap-2">
          {dirty && <span className="text-[10px] uppercase tracking-[0.18em] text-amber-400">Cambios sin guardar</span>}
          <Link to="/admin/projects" onClick={(e) => { if (dirty) { e.preventDefault(); setConfirmLeave(true); } }}>
            <AdminButton variant="ghost">Cancelar</AdminButton>
          </Link>
          <AdminButton data-testid="admin-save-project" variant="primary" disabled={saveStates.projects === "saving"} onClick={handleSave}>
            {saveStates.projects === "saving" ? "Guardando…" : "Guardar"}
          </AdminButton>
        </div>
      }
    >
      <ProjectForm value={draft} onChange={setDraft} errors={errors} />
      <AdminDialog
        open={confirmLeave}
        title="Cambios sin guardar"
        description="Si sales ahora, el borrador se conserva en esta sesión."
        confirmLabel="Salir"
        onCancel={() => setConfirmLeave(false)}
        onConfirm={() => navigate("/admin/projects")}
      />
    </AdminSection>
  );
};
