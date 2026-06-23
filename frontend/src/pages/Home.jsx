import { Link } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback } from "react";
import { ArrowUpRight, ArrowRight, ChevronDown } from "lucide-react";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { VideoPlayer } from "../components/VideoPlayer";
import { ProjectCard } from "../components/ProjectCard";
import { getActiveCategories } from "../lib/contentStore";
import { getPlayer, subscribeGlobalMuted } from "../lib/videoStore";
import { getVimeoPosterUrl, getVimeoBackgroundPlayerUrl } from "../lib/vimeo";
import { cloudinaryResponsive, DECOR_PRESET } from "../lib/cloudinary";

export default function Home() {
  const content = useContent();
  const [lang] = useLang();
  const [heroReelReady, setHeroReelReady] = useState(false);
  const [heroVideoEnabled, setHeroVideoEnabled] = useState(false);

  const featured = (content.projects || []).slice(0, 6);
  const showreelPoster = useMemo(
    () => getVimeoPosterUrl(content.site.showreel_url),
    [content.site.showreel_url],
  );

  // Cargar iframe del showreel pronto tras el primer pintado (el poster estático cubre LCP)
  useEffect(() => {
    let cancelled = false;
    let timer;

    const enableVideo = () => {
      if (cancelled) return;
      setHeroVideoEnabled(true);
    };

    const schedule = () => {
      timer = window.setTimeout(enableVideo, 150);
    };

    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => requestAnimationFrame(schedule));
    } else {
      schedule();
    }

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const startHeroShowreel = useCallback(() => {
    const player = getPlayer("hero-showreel");
    if (!player) return;

    try {
      player.setMuted(true).catch(() => {});
      player.setLoop(true).catch(() => {});
    } catch {}

    const tryPlay = (attempt = 0) => {
      player
        .play()
        .then(() => {
          player.getPaused().then((paused) => {
            if (!paused) setHeroReelReady(true);
          }).catch(() => {});
        })
        .catch(() => {
          if (attempt < 10) {
            window.setTimeout(() => tryPlay(attempt + 1), 200 + attempt * 120);
          }
        });
    };

    tryPlay();
  }, []);

  // Prefetch del player Vimeo cuando el navegador está idle (no compite con LCP)
  useEffect(() => {
    const href = getVimeoBackgroundPlayerUrl(content.site.showreel_url);
    if (!href) return undefined;

    let cancelled = false;
    const inject = () => {
      if (cancelled || document.querySelector(`link[rel="prefetch"][href="${href}"]`)) return;
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = href;
      document.head.appendChild(link);
    };

    let idleId;
    let usedIdleCallback = false;
    if (typeof window.requestIdleCallback === "function") {
      usedIdleCallback = true;
      idleId = window.requestIdleCallback(inject, { timeout: 5000 });
    } else {
      idleId = window.setTimeout(inject, 4000);
    }

    return () => {
      cancelled = true;
      if (usedIdleCallback) {
        window.cancelIdleCallback(idleId);
      } else {
        window.clearTimeout(idleId);
      }
    };
  }, [content.site.showreel_url]);

  // Quitar poster estático de index.html en cuanto React pinta (evita doble capa con el iframe)
  useEffect(() => {
    document.getElementById("static-hero-poster")?.remove();
  }, []);

  // Pausar showreel cuando el hero sale del viewport (evita artefactos al scroll)
  useEffect(() => {
    if (!heroVideoEnabled) return undefined;

    const hero = document.querySelector("[data-hero]");
    if (!hero) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const player = getPlayer("hero-showreel");
        if (!player) return;
        try {
          if (entry.isIntersecting) {
            player.play().catch(() => {});
          } else {
            player.pause().catch(() => {});
          }
        } catch {}
      },
      { threshold: 0.12 },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, [heroVideoEnabled]);

  // Keep the hero showreel permanently muted, even if global unmute is toggled
  useEffect(() => {
    if (!heroVideoEnabled) return undefined;

    const syncMuted = () => {
      const hero = getPlayer("hero-showreel");
      if (hero) {
        try { hero.setMuted(true).catch(() => {}); } catch {}
      }
    };

    syncMuted();
    const unsubscribe = subscribeGlobalMuted(syncMuted);
    return unsubscribe;
  }, [heroVideoEnabled]);

  return (
    <div data-testid="home-page" className="bg-white dark:bg-black transition-colors duration-500">
      {/* HERO — tarjeta Apple TV grande */}
      <section
        data-hero
        className="relative bg-black px-0 pt-0 sm:px-2 sm:pt-2"
        style={{ height: "100svh" }}
      >
        <div className="relative w-full h-full rounded-none sm:rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-neutral-950 hero-fullscreen hero-fullscreen--cover shadow-[0_40px_120px_-20px_rgba(0,0,0,1)]">
          {showreelPoster && (
            <img
              src={showreelPoster}
              alt=""
              fetchPriority="high"
              decoding="async"
              width={1920}
              height={1080}
              className={`absolute inset-0 z-[3] h-full w-full object-cover transition-opacity duration-700 ${
                heroReelReady ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
            />
          )}
          {heroVideoEnabled && (
            <div
              className={`absolute inset-0 z-[1] pointer-events-none overflow-hidden transition-opacity duration-700 ${
                heroReelReady ? "opacity-100" : "opacity-0"
              }`}
            >
              <VideoPlayer
                url={content.site.showreel_url}
                playerKey="hero-showreel"
                autoplay
                background
                muted={true}
                playing={true}
                className="w-full h-full"
                testId="hero-showreel"
                interactive={false}
                onReady={startHeroShowreel}
                onPlay={() => setHeroReelReady(true)}
              />
            </div>
          )}
          <div
            className={`pointer-events-none absolute inset-0 z-[1] bg-neutral-950 transition-opacity duration-700 ${
              heroReelReady ? "opacity-0" : showreelPoster ? "opacity-0" : "opacity-100"
            }`}
          />

          <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Oculta título de Vimeo mientras carga el iframe */}
          {!heroReelReady && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-16 bg-gradient-to-t from-black via-black/95 to-transparent" />
          )}

          <Link
            to="/showreel"
            className="absolute inset-0 z-10 cursor-pointer"
            aria-label={lang === "es" ? "Ver showreel" : "View showreel"}
          >
            <span className="sr-only">
              {lang === "es" ? "Ver showreel" : "View showreel"}
            </span>
          </Link>

          <div className="absolute right-5 bottom-6 sm:right-7 sm:bottom-8 md:right-9 md:bottom-10 z-20 pointer-events-none">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-2 text-[10px] tracking-[0.24em] uppercase text-white/90">
              {tr(T.hero.showreel, lang)}
              <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
            </span>
          </div>

          <div className="absolute bottom-6 sm:bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 text-[9px] tracking-[0.32em] uppercase pointer-events-none z-20">
            <span>{tr(T.hero.scroll, lang)}</span>
            <ChevronDown className="w-3.5 h-3.5 animate-bounce" strokeWidth={1} />
          </div>

          <h1 data-testid="hero-name" className="sr-only">{content.site.name}</h1>
          <p data-testid="hero-title" className="sr-only">{tr(content.site.title, lang)}</p>
        </div>
      </section>

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

                const isEven = gi % 2 === 0;
                return (
                  <div
                    key={group[0].id}
                    className={`grid grid-cols-1 md:grid-cols-12 ${GAP} md:items-stretch`}
                  >
                    {isEven ? (
                      <>
                        <div className="md:col-span-7 md:flex md:flex-col">
                          <ProjectCard
                            project={group[0]}
                            lang={lang}
                            eager={eager(0)}
                            index={baseIdx}
                            fill
                          />
                        </div>
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
                  const decor = thumb ? cloudinaryResponsive(thumb, DECOR_PRESET) : null;
                  return (
                    <Link
                      key={c.id}
                      to={`/work/${c.id}`}
                      className="group relative overflow-hidden rounded-2xl bg-neutral-950 ring-1 ring-white/10 hover:ring-white/25 transition-all duration-500 hover:scale-[1.02] p-5 flex flex-col justify-end min-h-[100px] sm:min-h-[120px]"
                    >
                      {decor && (
                        <img
                          src={decor.src}
                          srcSet={decor.srcSet}
                          sizes={decor.sizes}
                          alt=""
                          loading="lazy"
                          decoding="async"
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
