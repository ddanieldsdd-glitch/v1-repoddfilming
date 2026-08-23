import { Link } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { ArrowUpRight } from "lucide-react";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { HomeStillGrid } from "../components/HomeStillGrid";
import { getHomeProjects, getHomeThemeCards } from "../lib/homeGrid";
import { CATEGORIES } from "../lib/contentStore";
import { cloudinaryResponsive } from "../lib/cloudinary";

export default function Home() {
  const content = useContent();
  const [lang] = useLang();
  const tiles = useMemo(
    () => getHomeProjects(content.projects),
    [content.projects],
  );
  const themes = useMemo(
    () => getHomeThemeCards(content.projects),
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

      {themes.length > 0 && (
        <section
          data-testid="home-see-more"
          className="px-4 sm:px-6 md:px-12 lg:px-16 pt-6 md:pt-10 pb-16 md:pb-24"
        >
          <p className="text-[10px] tracking-[0.32em] uppercase text-white/45 mb-5 md:mb-7">
            {tr(T.work.seeMore, lang)}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {themes.map((theme) => {
              const cat = CATEGORIES.find((c) => c.id === theme.id);
              const img = theme.still
                ? cloudinaryResponsive(theme.still, {
                    widths: [720, 1080, 1440],
                    sizes: "(min-width: 768px) 42vw, 100vw",
                    quality: "good",
                  })
                : null;
              return (
                <Link
                  key={theme.id}
                  to={`/work/${theme.id}`}
                  data-testid={`home-theme-${theme.id}`}
                  className="group relative aspect-[16/9] overflow-hidden rounded-[1.75rem] md:rounded-[2.1rem] bg-neutral-950 ring-1 ring-white/10 hover:ring-white/25 transition"
                >
                  {img && (
                    <img
                      src={img.src}
                      srcSet={img.srcSet}
                      sizes={img.sizes}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
                  <h2 className="absolute left-6 bottom-6 md:left-8 md:bottom-8 text-2xl md:text-4xl font-light tracking-tight">
                    {cat ? cat[lang] : theme.id}
                  </h2>
                  <ArrowUpRight
                    className="absolute right-6 bottom-6 md:right-8 md:bottom-8 w-5 h-5 text-white/80 group-hover:text-white transition"
                    strokeWidth={1.4}
                  />
                </Link>
              );
            })}
          </div>
          <Link
            to="/work"
            data-testid="home-view-all"
            className="mt-6 md:mt-8 inline-flex items-center gap-2 text-[11px] tracking-[0.28em] uppercase text-white hover:opacity-60 transition"
          >
            {tr(T.work.all, lang)} <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
        </section>
      )}
    </div>
  );
}
