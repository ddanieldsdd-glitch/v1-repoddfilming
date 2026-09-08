import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES } from "../../lib/contentStore";
import { useAdminContent } from "./hooks/useAdminContent";
import { AdminSection } from "./AdminSection";
import { AdminButton } from "./AdminButton";
import { AdminDialog } from "./AdminDialog";
import { ProjectRow } from "./ProjectRow";
import { filterProjects } from "./lib/filterProjects";
import { inputCls } from "./styles";
import { fetchVimeoMeta } from "../../lib/vimeoMeta";

export const ProjectList = () => {
  const { content, removeProject, moveProjects, saveProject, saveStates } = useAdminContent();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("position");
  const [homeOnly, setHomeOnly] = useState(false);
  const [ratioOnly, setRatioOnly] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(
    () => filterProjects(content.projects, { query, status, category, homeOnly, ratioOnly, sort }),
    [category, content.projects, homeOnly, query, ratioOnly, sort, status],
  );

  const move = async (index, dir) => {
    const next = [...content.projects];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    await moveProjects(next.map((project) => project.id));
  };

  return (
    <AdminSection
      title={`Proyectos (${content.projects.length})`}
      description="Busca, filtra y edita cada pieza en su propia pantalla."
      actions={
        <Link to="/admin/projects/new" data-testid="admin-add-project">
          <AdminButton variant="primary">+ Añadir proyecto</AdminButton>
        </Link>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <input
          className={inputCls + " md:col-span-2"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título, slug, director o año"
          data-testid="admin-project-search"
        />
        <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">Todas las categorías</option>
          {CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>{item.es}</option>
          ))}
        </select>
        <select className={inputCls} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="position">Orden actual</option>
          <option value="title">Título</option>
          <option value="year">Año</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          ["all", "Todos"],
          ["published", "Publicados"],
          ["draft", "Borradores"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setStatus(id)}
            className={`border px-3 py-1 text-[10px] tracking-[0.18em] uppercase ${
              status === id ? "border-white bg-white text-black" : "border-white/20 text-neutral-400"
            }`}
          >
            {label}
          </button>
        ))}
        <button type="button" onClick={() => setHomeOnly((v) => !v)} className={`border px-3 py-1 text-[10px] tracking-[0.18em] uppercase ${homeOnly ? "border-white bg-white text-black" : "border-white/20 text-neutral-400"}`}>
          En portada
        </button>
        <button type="button" onClick={() => setRatioOnly((v) => !v)} className={`border px-3 py-1 text-[10px] tracking-[0.18em] uppercase ${ratioOnly ? "border-white bg-white text-black" : "border-white/20 text-neutral-400"}`}>
          Ratio pendiente
        </button>
      </div>
      <ul className="divide-y divide-white/10">
        {filtered.map(({ project, index }) => (
          <ProjectRow
            key={project.id}
            project={project}
            index={index}
            total={content.projects.length}
            saving={saveStates.projects === "saving"}
            onMove={move}
            onDelete={setDeleteTarget}
            onRecalculateRatio={async (item) => {
              const meta = await fetchVimeoMeta(item.preview_url);
              await saveProject({ ...item, preview_video_ratio: meta?.aspect_ratio });
            }}
          />
        ))}
      </ul>
      <AdminDialog
        open={Boolean(deleteTarget)}
        title="Eliminar proyecto"
        description={deleteTarget ? `¿Eliminar «${deleteTarget.title || deleteTarget.slug}» (${deleteTarget.slug})?` : ""}
        confirmLabel="Eliminar definitivamente"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await removeProject(deleteTarget);
          setDeleteTarget(null);
        }}
      />
    </AdminSection>
  );
};
