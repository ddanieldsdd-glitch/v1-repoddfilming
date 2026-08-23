import { Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowUpRight } from "lucide-react";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { ProjectCard } from "../components/ProjectCard";
import { getHomeProjects } from "../lib/homeGrid";

export default function Home() {
  const content = useContent();
  const [lang] = useLang();
  const tiles = getHomeProjects(content.projects);

  useEffect(() => {
    document.getElementById("static-hero-poster")?.remove();
  }, []);

  return (
    <div data-testid="home-page" className="bg-black text-white min-h-svh">
      <section
        data-testid="home-grid-section"
        className="px-1.5 sm:px-2 md:px-2.5 pt-[4.6rem] sm:pt-[5rem] md:pt-[5.35rem] pb-1.5 sm:pb-2"
      >
        {tiles.length === 0 ? (
          <div className="flex min-h-[70svh] items-center justify-center px-6">
            <p className="text-sm text-white/50">
              {lang === "es"
                ? "Todavía no hay proyectos en la portada. Elígelos desde /admin."
                : "No projects on the homepage yet. Pick them from /admin."}
            </p>
          </div>
        ) : (
          <div
            data-testid="home-bento-grid"
            className="grid grid-cols-12 grid-flow-dense gap-1.5 sm:gap-2 md:gap-2.5 home-bento"
          >
            {tiles.map((tile, i) => (
              <div
                key={tile.project.id || tile.project.slug}
                className={tile.className}
                data-testid={`home-tile-${tile.project.slug}`}
              >
                <ProjectCard
                  project={tile.project}
                  lang={lang}
                  cardSurface="home"
                  eager={i < 4}
                  index={i}
                  fill
                  imageOverride={tile.still}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="px-5 sm:px-8 md:px-12 py-10 md:py-14 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-white/10">
        <p className="text-[10px] tracking-[0.32em] uppercase text-white/40">
          {tr(T.work.title, lang)}
        </p>
        <Link
          to="/work"
          data-testid="home-view-all"
          className="inline-flex items-center gap-2 text-[11px] tracking-[0.28em] uppercase text-white border-b border-white pb-1 hover:opacity-60 transition"
        >
          {tr(T.work.viewAll, lang)} <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.5} />
        </Link>
      </div>
    </div>
  );
}
