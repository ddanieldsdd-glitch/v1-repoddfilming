import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  fetchContent,
  createProject,
  updateProject,
  deleteProject,
  reorderProjects,
  updateSite,
  updateHomeLayout,
  pushContent,
  getDefaultContent,
  ContentConflictError,
} from "../../../lib/contentStore";

const AdminContentContext = createContext(null);

export const AdminContentProvider = ({ initialContent, children }) => {
  const [content, setContent] = useState(initialContent);
  const [saveStates, setSaveStates] = useState({
    site: "idle",
    home: "idle",
    projects: "idle",
  });
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const reload = useCallback(async () => {
    const next = await fetchContent();
    setContent(next);
    setSaveStates({ site: "idle", home: "idle", projects: "idle" });
    return next;
  }, []);

  const run = useCallback(async (scope, action, successMessage) => {
    setSaveStates((prev) => ({ ...prev, [scope]: "saving" }));
    try {
      const next = await action();
      setContent(next);
      setSaveStates((prev) => ({ ...prev, [scope]: "saved" }));
      setLastSavedAt(new Date());
      if (successMessage) toast.success(successMessage);
      return next;
    } catch (err) {
      if (err instanceof ContentConflictError) {
        setSaveStates((prev) => ({ ...prev, [scope]: "conflict" }));
        toast.error("Este contenido se modificó en otra sesión. Recarga antes de guardar.");
      } else {
        setSaveStates((prev) => ({ ...prev, [scope]: "error" }));
        toast.error(err.message || "Error al guardar");
      }
      throw err;
    }
  }, []);

  const value = useMemo(
    () => ({
      content,
      saveStates,
      lastSavedAt,
      reload,
      saving: Object.values(saveStates).includes("saving"),
      saveSite: (payload) => run("site", () => updateSite(content, payload)),
      saveHome: (payload) => run("home", () => updateHomeLayout(content, payload)),
      saveNewProject: (project) =>
        run("projects", () => createProject(content, project, { position: "start" }), "Proyecto creado"),
      saveProject: (project) =>
        run("projects", () => updateProject(content, project), "Proyecto guardado"),
      removeProject: (project) =>
        run("projects", () => deleteProject(content, project), "Proyecto eliminado"),
      moveProjects: (order) =>
        run("projects", () => reorderProjects(content, order)),
      importContent: (json) =>
        run("projects", () => pushContent({ ...json, updated_at: content.updated_at }), "Importado"),
      resetAll: () =>
        run(
          "projects",
          () => pushContent({ ...getDefaultContent(), updated_at: content.updated_at }),
          "Contenido restablecido",
        ),
    }),
    [content, lastSavedAt, reload, run, saveStates],
  );

  return <AdminContentContext.Provider value={value}>{children}</AdminContentContext.Provider>;
};

export const useAdminContent = () => {
  const ctx = useContext(AdminContentContext);
  if (!ctx) throw new Error("useAdminContent must be used inside AdminContentProvider");
  return ctx;
};
