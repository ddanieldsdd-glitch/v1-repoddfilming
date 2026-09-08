import { Link } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { ArrowUpRight } from "lucide-react";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { HomeStillGrid } from "../components/HomeStillGrid";
import { HomeShowreel } from "../components/HomeShowreel";
import { CategoryExploreLinks } from "../components/CategoryExploreLinks";
import { getHomeProjects } from "../lib/homeGrid";
import { getActiveCategories } from "../lib/contentStore";
import { showreelOnHome } from "../lib/crop";

export default function Home() {
  const content = useContent();
  const [lang] = useLang();
  const homeMax = content.site?.home_max ?? 12;
  const tiles = useMemo(
    () => getHomeProjects(content.projects, homeMax),
    [content.projects, homeMax],
  );
  const showExplore = getActiveCategories(content.projects).length > 0;
  const showreelUrl = content.site?.showreel_url;
  const reelOnHome = showreelOnHome(content.site?.showreel_placement) && showreelUrl;

  useEffect(() => {
    document.getElementById("static-hero-poster")?.remove();
  }, []);

  return (
    <div data-testid="home-page" className="cinema-page min-h-svh">
      {reelOnHome && (
        <div className="px-2.5 sm:px-4 lg:px-6 pt-[4.25rem] sm:pt-[4.5rem] md:pt-[5rem]">
          <HomeShowreel url={showreelUrl} />
        </div>
      )}

      <section
        data-testid="home-grid-section"
        className={`px-4 sm:px-6 md:px-12 lg:px-16 pb-10 md:pb-16 ${
          reelOnHome
            ? "pt-24 md:pt-28 lg:pt-32"
            : "pt-[6.5rem] sm:pt-[7.5rem] md:pt-[9rem]"
        }`}
      >
        {tiles.length > 0 && (
          <div className="mb-7 flex items-end justify-between border-b border-white/10 pb-4 md:mb-10 md:pb-5">
            <h2 className="text-[10px] font-normal tracking-[0.2em] uppercase text-[var(--cinema-muted)]">
              {tr(T.work.title, lang)}
            </h2>
            <span className="text-[10px] tabular-nums tracking-[0.14em] text-white/45">
              {String(tiles.length).padStart(2, "0")}
            </span>
          </div>
        )}

        {tiles.length === 0 ? (
          <div className="flex min-h-[50svh] items-center justify-center">
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

      {showExplore && (
        <section
          data-testid="home-see-more"
          className="px-4 sm:px-6 md:px-12 lg:px-16 pt-10 md:pt-14 pb-24 md:pb-36 border-t border-white/10"
        >
          <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--cinema-muted)] mb-5 md:mb-7">
            {tr(T.work.seeMore, lang)}
          </p>
          <CategoryExploreLinks projects={content.projects} lang={lang} />
          <Link
            to="/work"
            data-testid="home-view-all"
            className="mt-6 md:mt-8 inline-flex items-center gap-2 text-[11px] tracking-[0.28em] uppercase text-white border-b border-white pb-1 hover:opacity-60 transition"
          >
            {tr(T.work.all, lang)} <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
        </section>
      )}
    </div>
  );
}
