import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { getActiveCategories } from "../lib/contentStore";
import { ProjectCard } from "../components/ProjectCard";

export default function Work() {
  const content = useContent();
  const [lang] = useLang();
  const { category } = useParams();
  const active = category || "all";

  const list = useMemo(() => {
    const all = content.projects || [];
    if (active === "all") return all;
    return all.filter((p) => p.category === active);
  }, [active, content.projects]);

  const linkBase =
    "text-[11px] tracking-[0.28em] uppercase pb-1 transition-colors";

  return (
    <div data-testid="work-page" className="bg-white dark:bg-black pt-32 md:pt-40 transition-colors duration-500">
      <div className="px-6 md:px-12 lg:px-16">
        <p className="text-[11px] tracking-[0.32em] uppercase text-neutral-500 dark:text-neutral-400 mb-4">
          {String((content.projects || []).length).padStart(2, "0")} —{" "}
          {tr(T.work.title, lang)}
        </p>
        <h1 className="text-4xl md:text-6xl lg:text-7xl tracking-tight font-light max-w-4xl text-black dark:text-white">
          {tr(T.work.title, lang)}
        </h1>

        {/* FILTERS */}
        <div className="mt-10 md:mt-14 flex flex-wrap gap-x-8 gap-y-3 border-t border-b border-black/10 dark:border-white/10 py-5">
          <Link
            to="/work"
            data-testid="filter-all"
            className={`${linkBase} ${active === "all" ? "text-black dark:text-white border-b border-black dark:border-white" : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white border-b border-transparent"}`}
          >
            {tr(T.work.all, lang)}
          </Link>
          {getActiveCategories(content.projects).map((c) => (
            <Link
              key={c.id}
              to={`/work/${c.id}`}
              data-testid={`filter-${c.id}`}
              className={`${linkBase} ${active === c.id ? "text-black dark:text-white border-b border-black dark:border-white" : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white border-b border-transparent"}`}
            >
              {c[lang]}
            </Link>
          ))}
        </div>

        {/* COMPACT GRID */}
        {list.length === 0 ? (
          <p className="py-32 text-neutral-500 dark:text-neutral-400" data-testid="work-empty">
            {tr(T.work.none, lang)}
          </p>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${active === "all" ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-x-5 md:gap-x-6 gap-y-10 md:gap-y-14 py-12 md:py-16`}>
            {list.map((p, i) => (
              <ProjectCard key={p.id} project={p} lang={lang} eager={i < 4} compact={active !== "all"} index={active !== "all" ? i : undefined} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
