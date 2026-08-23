import { Link } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { ArrowUpRight } from "lucide-react";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { HomeStillGrid } from "../components/HomeStillGrid";
import { getHomeProjects } from "../lib/homeGrid";

export default function Home() {
  const content = useContent();
  const [lang] = useLang();
  const tiles = useMemo(
    () => getHomeProjects(content.projects),
    [content.projects],
  );

  useEffect(() => {
    document.getElementById("static-hero-poster")?.remove();
  }, []);

  return (
    <div data-testid="home-page" className="bg-black text-white min-h-svh">
      <section
        data-testid="home-grid-section"
        className="px-4 sm:px-6 md:px-12 lg:px-16 pt-[4.6rem] sm:pt-[5rem] md:pt-[5.35rem] pb-6 md:pb-10"
      >
        {tiles.length === 0 ? (
          <div className="flex min-h-[70svh] items-center justify-center">
            <p className="text-sm text-white/50">
              {lang === "es"
                ? "Todavía no hay proyectos en la portada. Elígelos desde /admin."
                : "No projects on the homepage yet. Pick them from /admin."}
            </p>
          </div>
        ) : (
          <HomeStillGrid tiles={tiles} lang={lang} />
        )}
      </section>

      <div className="px-4 sm:px-6 md:px-12 lg:px-16 py-10 md:py-14 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-white/10">
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
