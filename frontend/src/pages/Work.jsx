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

  const allProjects = useMemo(() => content.projects || [], [content.projects]);

  // Número de proyectos visibles según el filtro activo
  const visibleCount = useMemo(
    () =>
      active === "all"
        ? allProjects.length
        : allProjects.filter((p) => p.category === active).length,
    [active, allProjects],
  );

  const btnBase =
    "text-[11px] tracking-[0.28em] uppercase pb-1 transition-colors whitespace-nowrap cursor-pointer bg-transparent border-0 p-0 font-inherit";

  return (
    <div data-testid="work-page" className="bg-white dark:bg-black pt-24 sm:pt-32 md:pt-40 transition-colors duration-500">
      <div className="px-4 sm:px-6 md:px-12 lg:px-16">
        <p className="text-[11px] tracking-[0.32em] uppercase text-neutral-500 dark:text-neutral-400 mb-4">
          {String(allProjects.length).padStart(2, "0")} —{" "}
          {tr(T.work.title, lang)}
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl tracking-tight font-light max-w-4xl text-black dark:text-white">
          {tr(T.work.title, lang)}
        </h1>

        {/* FILTROS */}
        <div className="mt-8 sm:mt-10 md:mt-14 flex flex-nowrap sm:flex-wrap gap-x-5 sm:gap-x-8 gap-y-3 border-t border-b border-black/10 dark:border-white/10 py-4 sm:py-5 -mx-1 px-1 overflow-x-auto">
          <button
            onClick={() => handleFilter("all")}
            data-testid="filter-all"
            className={`${btnBase} ${
              active === "all"
                ? "text-black dark:text-white border-b border-black dark:border-white"
                : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white border-b border-transparent"
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
                  ? "text-black dark:text-white border-b border-black dark:border-white"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white border-b border-transparent"
              }`}
            >
              {c[lang]}
            </button>
          ))}
        </div>

        {/* GRID — se renderizan todos los proyectos y se ocultan con CSS los que
            no coincidan con el filtro. Así los iframes de vídeo permanecen montados
            y la reproducción no se reinicia al cambiar de categoría. */}
        {visibleCount === 0 ? (
          <p className="py-32 text-neutral-500 dark:text-neutral-400" data-testid="work-empty">
            {tr(T.work.none, lang)}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 py-10 sm:py-12 md:py-16">
            {allProjects.map((p, i) => {
              const visible = active === "all" || p.category === active;
              return (
                <div key={p.id} className={visible ? undefined : "hidden"} aria-hidden={!visible}>
                  <ProjectCard
                    project={p}
                    lang={lang}
                    cardSurface="work"
                    eager={i < 4}
                    index={i}
                    aspectClass="aspect-video"
                    alwaysPlay
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
