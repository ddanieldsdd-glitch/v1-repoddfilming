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
    <div data-testid="home-page" className="bg-black text-white min-h-svh">
      <section
        data-testid="home-grid-section"
        className="px-4 sm:px-6 md:px-12 lg:px-16 pt-[4.6rem] sm:pt-[5rem] md:pt-[5.35rem] pb-6 md:pb-10"
      >
        {reelOnHome && <HomeShowreel url={showreelUrl} />}

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
          className="px-4 sm:px-6 md:px-12 lg:px-16 pt-6 md:pt-10 pb-16 md:pb-24 border-t border-white/10"
        >
          <p className="text-[10px] tracking-[0.32em] uppercase text-white/45 mb-5 md:mb-7">
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
