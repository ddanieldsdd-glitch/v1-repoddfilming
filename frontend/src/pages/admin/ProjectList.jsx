import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { getProjectVideoSeoLabel } from "../../lib/videoSeo";
import { fetchVimeoMeta, isVimeoUrl } from "../../lib/vimeoMeta";
import { ProjectForm } from "./ProjectForm";
import { ConfirmDialog } from "./ConfirmDialog";

const needsRatio = (project) =>
  isVimeoUrl(project.preview_url) &&
  !(typeof project.preview_video_ratio === "number" && project.preview_video_ratio > 0);

export const ProjectList = ({
  projects,
  saving,
  editing,
  draft,
  onStartNew,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onMove,
  onDraftChange,
  onRecalculateRatio,
}) => {
  const [filter, setFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(() => {
    if (filter === "published") return projects.filter((p) => p.published !== false);
    if (filter === "draft") return projects.filter((p) => p.published === false);
    return projects;
  }, [projects, filter]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await onDelete(deleteTarget.index);
    setDeleteTarget(null);
  };

  return (
    <div className="border border-white/10 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl tracking-tight">Projects ({projects.length})</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              ["all", "Todos"],
              ["published", "Publicados"],
              ["draft", "Borradores"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`border px-3 py-1 text-[10px] tracking-[0.18em] uppercase transition ${
                  filter === id
                    ? "border-white bg-white text-black"
                    : "border-white/20 text-neutral-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <button
          data-testid="admin-add-project"
          onClick={onStartNew}
          className="border border-white/30 px-4 py-2 text-[11px] tracking-[0.24em] uppercase text-white hover:bg-white hover:text-black transition"
        >
          + Add project
        </button>
      </div>

      {editing !== null && draft && (
        <div
          className="border border-white/20 p-5 md:p-6 mb-8 bg-[#0a0a0a]"
          data-testid="admin-project-form"
        >
          <p className="text-[11px] tracking-[0.28em] uppercase text-neutral-400 mb-4">
            {editing === "new" ? "New project" : "Edit project"}
          </p>
          <ProjectForm value={draft} onChange={onDraftChange} />
          <div className="mt-6 flex gap-3">
            <button
              data-testid="admin-save-project"
              onClick={onSaveEdit}
              disabled={saving}
              className="border border-white bg-white text-black px-5 py-2 text-[11px] tracking-[0.28em] uppercase hover:bg-transparent hover:text-white transition disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={onCancelEdit}
              className="border border-white/20 px-5 py-2 text-[11px] tracking-[0.28em] uppercase text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ul className="divide-y divide-white/10">
        {filtered.map((p) => {
          const index = projects.findIndex((item) => item.id === p.id);
          const videoSeo = getProjectVideoSeoLabel(p);
          const ratioPending = needsRatio(p);
          return (
            <li
              key={p.id}
              data-testid={`admin-row-${p.slug}`}
              className={`py-4 flex items-center gap-4 ${
                p.published === false ? "opacity-75 border-l-2 border-amber-500/70 pl-3" : ""
              }`}
            >
              <div className="w-16 h-12 bg-neutral-800 overflow-hidden shrink-0">
                {p.cover && (
                  <img src={p.cover} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm truncate">{p.title || <em>untitled</em>}</p>
                  {p.published === false ? (
                    <span className="shrink-0 text-[9px] tracking-[0.2em] uppercase text-amber-300 bg-amber-950/40 border border-amber-500/40 px-1.5 py-0.5">
                      Borrador
                    </span>
                  ) : (
                    <span className="shrink-0 text-[9px] tracking-[0.2em] uppercase text-emerald-300 bg-emerald-950/30 border border-emerald-500/30 px-1.5 py-0.5">
                      Publicado
                    </span>
                  )}
                  {ratioPending && (
                    <span className="shrink-0 text-[9px] tracking-[0.18em] uppercase text-amber-400 border border-amber-500/30 px-1.5 py-0.5">
                      Ratio pendiente
                    </span>
                  )}
                  <span
                    title={videoSeo.title}
                    className={`shrink-0 text-[9px] tracking-[0.18em] uppercase px-1.5 py-0.5 border ${
                      videoSeo.status === "ok"
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : videoSeo.status === "draft"
                          ? "text-neutral-500 bg-neutral-100 border-neutral-200"
                          : "text-neutral-500 bg-neutral-50 border-neutral-200"
                    }`}
                  >
                    {videoSeo.label}
                  </span>
                </div>
                <p className="text-[11px] tracking-[0.2em] uppercase text-neutral-400 truncate">
                  {p.category} · {p.year} · {p.director}
                </p>
              </div>
              <div className="flex items-center gap-1 md:gap-2 flex-wrap justify-end">
                {p.slug && (
                  <Link
                    to={`/project/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`admin-preview-${p.slug}`}
                    onClick={() => {
                      if (p.published === false) {
                        toast.message("Vista previa admin", {
                          description:
                            "Este borrador no es visible en Work/Home hasta publicarlo.",
                        });
                      }
                    }}
                    className="border border-white/20 px-3 py-1 text-[10px] tracking-[0.24em] uppercase text-white hover:border-white"
                  >
                    Preview
                  </Link>
                )}
                {ratioPending && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => onRecalculateRatio(p, index)}
                    className="border border-amber-500/30 px-3 py-1 text-[10px] tracking-[0.18em] uppercase text-amber-300 hover:bg-amber-400 hover:text-black disabled:opacity-30"
                  >
                    Recalcular ratio
                  </button>
                )}
                <button
                  onClick={() => onMove(index, -1)}
                  disabled={saving || index <= 0}
                  className="px-2 py-1 text-xs text-neutral-400 hover:text-white disabled:opacity-30"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => onMove(index, 1)}
                  disabled={saving || index >= projects.length - 1}
                  className="px-2 py-1 text-xs text-neutral-400 hover:text-white disabled:opacity-30"
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  data-testid={`admin-edit-${p.slug}`}
                  onClick={() => onStartEdit(index)}
                  className="border border-white/20 px-3 py-1 text-[10px] tracking-[0.24em] uppercase text-white hover:border-white"
                >
                  Edit
                </button>
                <button
                  data-testid={`admin-delete-${p.slug}`}
                  onClick={() => setDeleteTarget({ project: p, index })}
                  disabled={saving}
                  className="border border-white/20 px-3 py-1 text-[10px] tracking-[0.24em] uppercase text-red-400 hover:border-red-400 disabled:opacity-30"
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar proyecto"
        description={
          deleteTarget
            ? `¿Eliminar definitivamente «${deleteTarget.project.title || deleteTarget.project.slug}» (${deleteTarget.project.slug})?`
            : ""
        }
        confirmLabel="Eliminar definitivamente"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export { needsRatio, fetchVimeoMeta };
