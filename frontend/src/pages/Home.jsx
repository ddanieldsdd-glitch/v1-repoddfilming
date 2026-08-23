import { Link } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { ArrowUpRight } from "lucide-react";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { HomeStillGrid } from "../components/HomeStillGrid";
import { HomeShowreel } from "../components/HomeShowreel";
import { getHomeProjects, getHomeThemeCards } from "../lib/homeGrid";
import { getActiveCategories } from "../lib/contentStore";
import { cloudinaryResponsive } from "../lib/cloudinary";
import { showreelOnHome } from "../lib/crop";

export default function Home() {
  const content = useContent();
  const [lang] = useLang();
  const homeMax = content.site?.home_max ?? 12;
  const tiles = useMemo(
    () => getHomeProjects(content.projects, homeMax),
    [content.projects, homeMax],
  );
  const themes = useMemo(
    () => getHomeThemeCards(content.projects),
    [content.projects],
  );
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

      {themes.length > 0 && (
        <section
          data-testid="home-see-more"
          className="px-4 sm:px-6 md:px-12 lg:px-16 pt-6 md:pt-10 pb-16 md:pb-24 border-t border-white/10"
        >
          <p className="text-[10px] tracking-[0.32em] uppercase text-white/45 mb-5 md:mb-7">
            {tr(T.work.seeMore, lang)}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
            {getActiveCategories(content.projects)
              .filter((c) => themes.some((t) => t.id === c.id))
              .slice(0, 2)
              .map((cat) => {
                const theme = themes.find((t) => t.id === cat.id);
                const img = theme?.still
                  ? cloudinaryResponsive(theme.still, {
                      widths: [720, 1080, 1440],
                      sizes: "(min-width: 768px) 42vw, 100vw",
                      quality: "good",
                    })
                  : null;
                return (
                  <Link
                    key={cat.id}
                    to={`/work/${cat.id}`}
                    data-testid={`home-theme-${cat.id}`}
                    className="group relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] aspect-[4/3] sm:aspect-video bg-neutral-950 border border-white/10"
                  >
                    {img && (
                      <img
                        src={img.src}
                        srcSet={img.srcSet}
                        sizes={img.sizes}
                        alt={cat[lang]}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 transition duration-500 group-hover:opacity-80 group-hover:scale-[1.04]"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 flex items-end justify-between gap-4">
                      <h2 className="text-xl md:text-2xl font-light tracking-tight">
                        {cat[lang]}
                      </h2>
                      <ArrowUpRight
                        className="w-5 h-5 text-white/80 group-hover:text-white transition shrink-0"
                        strokeWidth={1.4}
                      />
                    </div>
                  </Link>
                );
              })}
          </div>
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
