import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { getActiveCategories } from "../lib/contentStore";
import { ProjectCard } from "../components/ProjectCard";

export default function Work() {
  const content = useContent();
  const [lang] = useLang();
  const { category } = useParams();
  const navigate = useNavigate();

  // Estado local para el filtro activo — evita cambio de ruta y salto de scroll
  const [active, setActive] = useState(category || "all");

  const handleFilter = (id) => {
    setActive(id);
    const path = id === "all" ? "/work" : `/work/${id}`;
    navigate(path, { replace: true, preventScrollReset: true });
  };

  const allProjects = useMemo(
    () => (content.projects || []).filter((p) => p.published !== false),
    [content.projects],
  );

  const visibleProjects = useMemo(
    () => (active === "all" ? allProjects : allProjects.filter((p) => p.category === active)),
    [active, allProjects],
  );

  const btnBase =
    "text-[10px] tracking-[0.22em] uppercase pb-1 transition-colors whitespace-nowrap cursor-pointer bg-transparent border-0 p-0 font-inherit";

  return (
    <div data-testid="work-page" className="cinema-page pt-24 sm:pt-32 md:pt-40 transition-colors duration-500">
      <div className="px-4 sm:px-6 md:px-12 lg:px-16">
        <p className="text-[10px] tracking-[0.22em] uppercase text-[var(--cinema-muted)] mb-4">
          {String(allProjects.length).padStart(2, "0")} —{" "}
          {tr(T.work.title, lang)}
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl tracking-tight font-light max-w-4xl text-[var(--cinema-fg)]">
          {tr(T.work.title, lang)}
        </h1>

        {/* FILTROS */}
        <div className="mt-8 sm:mt-10 md:mt-14 flex flex-nowrap sm:flex-wrap gap-x-5 sm:gap-x-8 gap-y-3 border-t border-b border-black/10 dark:border-white/10 py-4 sm:py-5 -mx-1 px-1 overflow-x-auto">
          <button
            onClick={() => handleFilter("all")}
            data-testid="filter-all"
            className={`${btnBase} ${
              active === "all"
                ? "text-[var(--cinema-fg)] border-b border-[var(--cinema-fg)]"
                : "text-[var(--cinema-muted)] hover:text-[var(--cinema-fg)] border-b border-transparent"
            }`}
          >
            {tr(T.work.all, lang)}
          </button>
          {getActiveCategories(content.projects).map((c) => (
            <button
              key={c.id}
              onClick={() => handleFilter(c.id)}
              data-testid={`filter-${c.id}`}
              className={`${btnBase} ${
                active === c.id
                  ? "text-[var(--cinema-fg)] border-b border-[var(--cinema-fg)]"
                  : "text-[var(--cinema-muted)] hover:text-[var(--cinema-fg)] border-b border-transparent"
              }`}
            >
              {c[lang]}
            </button>
          ))}
        </div>

        {visibleProjects.length === 0 ? (
          <p className="py-32 text-[var(--cinema-muted)]" data-testid="work-empty">
            {tr(T.work.none, lang)}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 py-10 sm:py-12 md:py-16">
            {visibleProjects.map((p, i) => (
              <ProjectCard
                key={p.id}
                project={p}
                lang={lang}
                cardSurface="work"
                eager={i < 4}
                index={i}
                aspectClass="aspect-video"
                alwaysPlay
                fit="cover"
                previewCrop={p.preview_crop ?? p.work_crop}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
