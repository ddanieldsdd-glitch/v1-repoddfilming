import { Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { ArrowUpRight, ArrowRight, ChevronDown, X } from "lucide-react";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { VideoPlayer } from "../components/VideoPlayer";
import { ProjectCard } from "../components/ProjectCard";
import { getActiveCategories } from "../lib/contentStore";
import { getPlayer, subscribeGlobalMuted } from "../lib/videoStore";
import { getVimeoPosterUrl } from "../lib/vimeo";
import { optimizeCloudinaryUrl, IMG } from "../lib/cloudinary";

export default function Home() {
  const content = useContent();
  const [lang] = useLang();
  const [showReelOpen, setShowReelOpen] = useState(false);
  const [showReelClosing, setShowReelClosing] = useState(false);
  const [heroReelReady, setHeroReelReady] = useState(false);
  const [modalReelReady, setModalReelReady] = useState(false);
  const [heroVideoEnabled, setHeroVideoEnabled] = useState(false);

  const featured = (content.projects || []).slice(0, 6);
  const showreelPoster = useMemo(
    () => getVimeoPosterUrl(content.site.showreel_url),
    [content.site.showreel_url],
  );

  // Diferir iframe Vimeo: prioriza LCP (poster + CSS) antes del vídeo pesado
  useEffect(() => {
    let cancelled = false;
    const enable = () => {
      if (!cancelled) setHeroVideoEnabled(true);
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(enable, { timeout: 2800 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }
    const t = window.setTimeout(enable, 2200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  const openShowReel = () => {
    setShowReelClosing(false);
    setModalReelReady(false);
    setShowReelOpen(true);
  };

  const closeShowReel = () => {
    setShowReelClosing(true);
    window.setTimeout(() => {
      setShowReelOpen(false);
      setShowReelClosing(false);
    }, 260);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") closeShowReel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Keep the hero showreel permanently muted, even if global unmute is toggled
  useEffect(() => {
    // Immediately mute on mount
    const hero = getPlayer("hero-showreel");
    if (hero) {
      try { hero.setMuted(true).catch(() => {}); } catch {}
    }
    // Re-mute whenever global mute state changes
    const unsubscribe = subscribeGlobalMuted(() => {
      const h = getPlayer("hero-showreel");
      if (h) {
        try { h.setMuted(true).catch(() => {}); } catch {}
      }
    });
    return unsubscribe;
  }, []);

  return (
    <div data-testid="home-page" className="bg-white dark:bg-black transition-colors duration-500">
      {/* HERO — tarjeta Apple TV grande */}
      <section
        data-hero
        className="relative bg-black"
        style={{ height: "100svh", padding: "8px 8px 0" }}
      >
        {/* Tarjeta redondeada que ocupa casi toda la pantalla */}
        <div className="relative w-full h-full rounded-[1.75rem] sm:rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-neutral-950 hero-fullscreen shadow-[0_40px_120px_-20px_rgba(0,0,0,1)]">
          {showreelPoster && (
            <img
              src={showreelPoster}
              alt=""
              fetchPriority="high"
              decoding="async"
              className={`absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-700 ${
                heroReelReady ? "opacity-0" : "opacity-100"
              }`}
            />
          )}
          {heroVideoEnabled && (
            <div className="absolute inset-0 pointer-events-none">
              <VideoPlayer
                url={content.site.showreel_url}
                playerKey="hero-showreel"
                autoplay
                background
                muted={true}
                className="w-full h-full"
                testId="hero-showreel"
                interactive={false}
                onReady={() => setHeroReelReady(true)}
              />
            </div>
          )}
          {/* Overlay que se desvanece cuando el vídeo está listo */}
          <div
            className={`pointer-events-none absolute inset-0 z-[1] bg-neutral-950 transition-opacity duration-700 ${
              heroReelReady ? "opacity-0" : showreelPoster ? "opacity-0" : "opacity-100"
            }`}
          />

          {/* Gradiente inferior para legibilidad */}
          <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Botón invisible que abre el reel */}
          <button
            type="button"
            onClick={openShowReel}
            className="absolute inset-0 z-10 cursor-pointer"
            aria-label={lang === "es" ? "Ver reel en grande" : "View reel fullscreen"}
          >
            <span className="sr-only">
              {lang === "es" ? "Ver reel en grande" : "View reel fullscreen"}
            </span>
          </button>

          {/* Etiqueta "Ver reel" — pill estilo Apple TV */}
          <div className="absolute right-5 bottom-6 sm:right-7 sm:bottom-8 md:right-9 md:bottom-10 z-20 pointer-events-none">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-2 text-[10px] tracking-[0.24em] uppercase text-white/90">
              {lang === "es" ? "Ver reel" : "View reel"}
              <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
            </span>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-6 sm:bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 text-[9px] tracking-[0.32em] uppercase pointer-events-none z-20">
            <span>{tr(T.hero.scroll, lang)}</span>
            <ChevronDown className="w-3.5 h-3.5 animate-bounce" strokeWidth={1} />
          </div>

          <h1 data-testid="hero-name" className="sr-only">{content.site.name}</h1>
          <p data-testid="hero-title" className="sr-only">{tr(content.site.title, lang)}</p>
        </div>
      </section>

      {showReelOpen && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 px-2 py-10 backdrop-blur-md transition-opacity duration-300 md:px-6 md:py-12 ${showReelClosing ? "opacity-0" : "opacity-100 animate-[ddpFadeUp_320ms_ease-out_both]"}`}
          onClick={closeShowReel}
        >
          <button
            type="button"
            onClick={closeShowReel}
            className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:border-white hover:text-white md:right-8 md:top-8"
            aria-label="Close reel"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <div
            className={`relative aspect-video w-full max-w-[min(96vw,calc(92svh*16/9))] overflow-hidden bg-black shadow-2xl transition-transform duration-300 ease-out ${showReelClosing ? "scale-[0.985]" : "scale-100"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <VideoPlayer
              url={content.site.showreel_url}
              playerKey="hero-showreel-modal"
              autoplay
              className={`h-full w-full transition-opacity duration-700 ${modalReelReady ? "opacity-100" : "opacity-0"}`}
              testId="hero-showreel-fullscreen"
              interactive
              onReady={() => setModalReelReady(true)}
            />
            {!modalReelReady && (
              <div className="pointer-events-none absolute inset-0 bg-black" />
            )}
          </div>
        </div>
      )}

      {/* SELECTED WORK */}
      <section
        data-testid="home-selected-section"
        className="px-4 sm:px-6 md:px-12 lg:px-16 pt-16 pb-14 sm:pt-20 sm:pb-16 md:pt-28 md:pb-24 border-t border-black/10 dark:border-white/10"
      >
        <div className="flex items-end justify-between gap-8 mb-12 md:mb-16">
          <div>
            <p className="text-[10px] tracking-[0.32em] uppercase text-neutral-500 dark:text-neutral-400 mb-4">
              01 — {tr(T.work.all, lang)}
            </p>
            <h2 className="text-3xl md:text-5xl tracking-tight font-light text-black dark:text-white">
              {tr(T.work.title, lang)}
            </h2>
          </div>
          <Link
            to="/work"
            data-testid="home-view-all"
            className="hidden md:inline-flex items-center gap-2 text-[11px] tracking-[0.28em] uppercase text-black dark:text-white border-b border-black dark:border-white pb-1 hover:opacity-60 transition"
          >
            {tr(T.work.all, lang)} <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
        </div>

        {/* Layout alternante: 1 grande + 2 pequeños / 2 pequeños + 1 grande */}
        {(() => {
          const GAP = "gap-3 sm:gap-4 md:gap-5";
          const groups = [];
          for (let i = 0; i < featured.length; i += 3) {
            groups.push(featured.slice(i, Math.min(i + 3, featured.length)));
          }
          return (
            <div className={`flex flex-col ${GAP}`}>
              {groups.map((group, gi) => {
                const baseIdx = gi * 3;
                const eager   = (i) => baseIdx + i < 2;

                // Grupo de 1 sola tarjeta → ancho completo
                if (group.length === 1) {
                  return (
                    <ProjectCard
                      key={group[0].id}
                      project={group[0]}
                      lang={lang}
                      eager={eager(0)}
                      index={baseIdx}
                      aspectClass="aspect-video"
                    />
                  );
                }

                // Grupo de 2 tarjetas → grid 2 columnas iguales
                if (group.length === 2) {
                  return (
                    <div key={group[0].id} className={`grid grid-cols-2 ${GAP}`}>
                      {group.map((p, j) => (
                        <ProjectCard
                          key={p.id}
                          project={p}
                          lang={lang}
                          eager={eager(j)}
                          index={baseIdx + j}
                          aspectClass="aspect-video"
                        />
                      ))}
                    </div>
                  );
                }

                // Grupo de 3: alterna grande-izq/peq-der ↔ peq-izq/grande-der
                const isEven = gi % 2 === 0;
                return (
                  <div
                    key={group[0].id}
                    className={`grid grid-cols-1 md:grid-cols-12 ${GAP} md:items-stretch`}
                  >
                    {isEven ? (
                      <>
                        {/* GRANDE izquierda */}
                        <div className="md:col-span-7 md:flex md:flex-col">
                          <ProjectCard
                            project={group[0]}
                            lang={lang}
                            eager={eager(0)}
                            index={baseIdx}
                            fill
                          />
                        </div>
                        {/* 2 PEQUEÑOS derecha */}
                        <div className={`md:col-span-5 flex flex-col ${GAP}`}>
                          <ProjectCard
                            project={group[1]}
                            lang={lang}
                            eager={eager(1)}
                            index={baseIdx + 1}
                            aspectClass="aspect-video"
                          />
                          <ProjectCard
                            project={group[2]}
                            lang={lang}
                            eager={eager(2)}
                            index={baseIdx + 2}
                            aspectClass="aspect-video"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {/* 2 PEQUEÑOS izquierda */}
                        <div className={`md:col-span-5 flex flex-col ${GAP}`}>
                          <ProjectCard
                            project={group[0]}
                            lang={lang}
                            eager={eager(0)}
                            index={baseIdx}
                            aspectClass="aspect-video"
                          />
                          <ProjectCard
                            project={group[1]}
                            lang={lang}
                            eager={eager(1)}
                            index={baseIdx + 1}
                            aspectClass="aspect-video"
                          />
                        </div>
                        {/* GRANDE derecha */}
                        <div className="md:col-span-7 md:flex md:flex-col">
                          <ProjectCard
                            project={group[2]}
                            lang={lang}
                            eager={eager(2)}
                            index={baseIdx + 2}
                            fill
                          />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Ver más — 2 tiles de categoría */}
        {(() => {
          const active = getActiveCategories(content.projects || []).slice(0, 2);
          if (active.length === 0) return null;
          return (
            <div className="mt-14 md:mt-20 pt-12 border-t border-black/10 dark:border-white/10">
              <p className="text-[10px] tracking-[0.32em] uppercase text-neutral-500 dark:text-neutral-400 mb-6">
                {lang === "es" ? "Ver más" : "More work"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {active.map((c) => {
                  const catProjects = (content.projects || []).filter(
                    (p) => p.category === c.id && p.published !== false
                  );
                  const thumb = catProjects[0]?.poster || catProjects[0]?.cover || null;
                  return (
                    <Link
                      key={c.id}
                      to={`/work/${c.id}`}
                      className="group relative overflow-hidden rounded-2xl bg-neutral-950 ring-1 ring-white/10 hover:ring-white/25 transition-all duration-500 hover:scale-[1.02] p-5 flex flex-col justify-end min-h-[100px] sm:min-h-[120px]"
                    >
                      {thumb && (
                        <img
                          src={oimg(thumb, IMG.card)}
                          alt=""
                          className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-500 scale-[1.04] group-hover:scale-100"
                        />
                      )}
                      <div className="relative z-10">
                        <span className="text-lg sm:text-xl font-light tracking-tight text-white">
                          {c[lang]}
                        </span>
                      </div>
                      <ArrowRight className="absolute right-4 bottom-4 h-4 w-4 text-white/30 group-hover:text-white/70 group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
                    </Link>
                  );
                })}
              </div>
              <div className="mt-8">
                <Link
                  to="/work"
                  data-testid="home-view-all-mobile"
                  className="inline-flex items-center gap-2 text-[11px] tracking-[0.28em] uppercase text-black dark:text-white border-b border-black dark:border-white pb-1 hover:opacity-60 transition"
                >
                  {tr(T.work.all, lang)} <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                </Link>
              </div>
            </div>
          );
        })()}
      </section>

    </div>
  );
}
