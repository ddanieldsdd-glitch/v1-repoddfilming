import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { CATEGORIES } from "../lib/contentStore";
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
    <div data-testid="work-page" className="bg-white pt-32 md:pt-40">
      <div className="px-6 md:px-12 lg:px-16">
        <p className="text-[11px] tracking-[0.32em] uppercase text-neutral-500 mb-4">
          {String((content.projects || []).length).padStart(2, "0")} —{" "}
          {tr(T.work.title, lang)}
        </p>
        <h1 className="text-4xl md:text-6xl lg:text-7xl tracking-tight font-light max-w-4xl">
          {tr(T.work.title, lang)}
        </h1>

        {/* FILTERS */}
        <div className="mt-12 md:mt-16 flex flex-wrap gap-x-8 gap-y-3 border-t border-b border-black/10 py-5">
          <Link
            to="/work"
            data-testid="filter-all"
            className={`${linkBase} ${active === "all" ? "text-black border-b border-black" : "text-neutral-500 hover:text-black border-b border-transparent"}`}
          >
            {tr(T.work.all, lang)}
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              to={`/work/${c.id}`}
              data-testid={`filter-${c.id}`}
              className={`${linkBase} ${active === c.id ? "text-black border-b border-black" : "text-neutral-500 hover:text-black border-b border-transparent"}`}
            >
              {c[lang]}
            </Link>
          ))}
        </div>

        {/* FULL-BLEED LIST */}
        {list.length === 0 ? (
          <p className="py-32 text-neutral-500" data-testid="work-empty">
            {tr(T.work.none, lang)}
          </p>
        ) : (
          <div className="flex flex-col gap-20 md:gap-28 py-16 md:py-24">
            {list.map((p, i) => (
              <ProjectCard key={p.id} project={p} lang={lang} eager={i < 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
