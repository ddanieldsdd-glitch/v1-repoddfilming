import { Link } from "react-router-dom";
import { toast } from "sonner";
import { getProjectVideoSeoLabel } from "../../lib/videoSeo";
import { isVimeoUrl } from "../../lib/vimeoMeta";
import { AdminButton } from "./AdminButton";

export const needsRatio = (project) =>
  isVimeoUrl(project.preview_url) &&
  !(typeof project.preview_video_ratio === "number" && project.preview_video_ratio > 0);

export const ProjectRow = ({ project, index, total, onMove, onDelete, onRecalculateRatio, saving }) => {
  const videoSeo = getProjectVideoSeoLabel(project);
  const ratioPending = needsRatio(project);

  return (
    <li
      data-testid={`admin-row-${project.slug}`}
      className={`py-4 flex flex-col md:flex-row md:items-center gap-4 ${
        project.published === false ? "opacity-80 border-l-2 border-amber-500/70 pl-3" : ""
      }`}
    >
      <div className="w-16 h-12 bg-neutral-800 overflow-hidden shrink-0">
        {project.cover && <img src={project.cover} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm truncate">{project.title || <em>sin título</em>}</p>
          <span className={`text-[9px] tracking-[0.2em] uppercase px-1.5 py-0.5 border ${
            project.published === false
              ? "text-amber-300 border-amber-500/40"
              : "text-emerald-300 border-emerald-500/30"
          }`}>
            {project.published === false ? "Borrador" : "Publicado"}
          </span>
          {ratioPending && (
            <span className="text-[9px] tracking-[0.18em] uppercase text-amber-400 border border-amber-500/30 px-1.5 py-0.5">
              Ratio pendiente
            </span>
          )}
          <span className="text-[9px] tracking-[0.18em] uppercase text-neutral-400 border border-white/10 px-1.5 py-0.5">
            {videoSeo.label}
          </span>
        </div>
        <p className="text-[11px] tracking-[0.2em] uppercase text-neutral-400 truncate">
          {project.category} · {project.year} · {project.director}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {project.slug && (
          <Link
            to={`/project/${project.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={`admin-preview-${project.slug}`}
            onClick={() => {
              if (project.published === false) {
                toast.message("Vista previa", { description: "Este borrador no es visible en Work/Home hasta publicarlo." });
              }
            }}
            className="border border-white/20 px-3 py-1 text-[10px] tracking-[0.24em] uppercase"
          >
            Preview
          </Link>
        )}
        {ratioPending && (
          <AdminButton disabled={saving} onClick={() => onRecalculateRatio(project)}>
            Recalcular ratio
          </AdminButton>
        )}
        <button type="button" onClick={() => onMove(index, -1)} disabled={saving || index <= 0} aria-label="Subir" className="px-2 text-neutral-400">↑</button>
        <button type="button" onClick={() => onMove(index, 1)} disabled={saving || index >= total - 1} aria-label="Bajar" className="px-2 text-neutral-400">↓</button>
        <Link
          to={`/admin/projects/${project.id}`}
          data-testid={`admin-edit-${project.slug}`}
          className="border border-white/20 px-3 py-1 text-[10px] tracking-[0.24em] uppercase"
        >
          Editar
        </Link>
        <AdminButton
          variant="danger"
          data-testid={`admin-delete-${project.slug}`}
          disabled={saving}
          onClick={() => onDelete(project)}
        >
          Eliminar
        </AdminButton>
      </div>
    </li>
  );
};
