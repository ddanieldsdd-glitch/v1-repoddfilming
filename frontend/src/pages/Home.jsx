import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronDown, X } from "lucide-react";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { VideoPlayer } from "../components/VideoPlayer";
import { ProjectCard } from "../components/ProjectCard";
import { CATEGORIES, getActiveCategories } from "../lib/contentStore";
import { getPlayer, subscribeGlobalMuted } from "../lib/videoStore";

export default function Home() {
  const content = useContent();
  const [lang] = useLang();
  const [showReelOpen, setShowReelOpen] = useState(false);
  const [showReelClosing, setShowReelClosing] = useState(false);
  const [heroReelReady, setHeroReelReady] = useState(false);
  const [modalReelReady, setModalReelReady] = useState(false);

  const featured = (content.projects || []).slice(0, 6);

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
    const unsubscribe = subscribeGlobalMuted(() => {
      const hero = getPlayer("hero-showreel");
      if (hero) {
        try { hero.setMuted(true).catch(() => {}); } catch {}
      }
    });
    return unsubscribe;
  }, []);

  return (
    <div data-testid="home-page" className="bg-white dark:bg-black transition-colors duration-500">
      {/* FULLSCREEN HERO */}
      <section data-hero className="relative w-full h-screen bg-black overflow-hidden hero-fullscreen">
        <div className="absolute inset-0 pointer-events-none">
          <VideoPlayer
            url={content.site.showreel_url}
            playerKey="hero-showreel"
            autoplay
            background
            muted={true}
            className={`w-full h-full transition-opacity duration-300 ${heroReelReady ? "opacity-100" : "opacity-0"}`}
            testId="hero-showreel"
            interactive={false}
            onReady={() => setHeroReelReady(true)}
          />
        </div>
        {!heroReelReady && (
          <div className="pointer-events-none absolute inset-0 z-[1] bg-black" />
        )}
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
        <div className="absolute right-6 bottom-8 md:right-10 md:bottom-10 z-20 pointer-events-none">
          <span className="inline-flex items-center gap-2 border border-white/30 bg-black/20 px-4 py-2 text-[10px] tracking-[0.28em] uppercase text-white/80 backdrop-blur-sm">
            {lang === "es" ? "Ver reel" : "View reel"}
            <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
          </span>
        </div>
        <div className="absolute bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/70 text-[10px] tracking-[0.32em] uppercase pointer-events-none">
          <span>{tr(T.hero.scroll, lang)}</span>
          <ChevronDown className="w-4 h-4 animate-bounce" strokeWidth={1} />
        </div>
        <h1 data-testid="hero-name" className="sr-only">
          {content.site.name}
        </h1>
        <p data-testid="hero-title" className="sr-only">
          {tr(content.site.title, lang)}
        </p>
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
        className="px-6 md:px-12 lg:px-16 pt-20 pb-16 md:pt-28 md:pb-24 border-t border-black/10 dark:border-white/10"
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

        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 md:gap-x-8 gap-y-12 md:gap-y-16 items-start">
          {featured.map((p, i) => (
            <div
              key={p.id}
              className={
                i === 0
                  ? "md:col-span-8"
                  : i === 1
                    ? "md:col-span-4 md:pt-24"
                    : i % 3 === 2
                      ? "md:col-span-5"
                      : "md:col-span-7"
              }
            >
              <ProjectCard project={p} lang={lang} eager={i < 2} index={i} />
            </div>
          ))}
        </div>

        <div className="mt-10 md:hidden">
          <Link
            to="/work"
            data-testid="home-view-all-mobile"
            className="inline-flex items-center gap-2 text-[11px] tracking-[0.28em] uppercase text-black dark:text-white border-b border-black dark:border-white pb-1"
          >
            {tr(T.work.all, lang)} <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
        </div>
      </section>

      {/* CATEGORIES STRIP — empty categories are hidden automatically */}
      {(() => {
        const active = getActiveCategories(content.projects);
        if (active.length === 0) return null;
        const cols =
          active.length === 1
            ? "grid-cols-1"
            : active.length === 2
              ? "grid-cols-2"
              : active.length === 3
                ? "grid-cols-3"
                : "grid-cols-2 md:grid-cols-4";
        return (
          <section className="px-6 md:px-12 lg:px-16 py-10 md:py-12 border-t border-black/10 dark:border-white/10">
            <div className={`grid ${cols} gap-y-6 gap-x-6`}>
              {active.map((c) => (
                <Link
                  key={c.id}
                  to={`/work/${c.id}`}
                  data-testid={`home-category-${c.id}`}
                  className="group block"
                >
                  <p className="text-lg md:text-xl tracking-tight text-black dark:text-white group-hover:opacity-50 transition">
                    {c[lang]}
                  </p>
                  <span className="mt-2 inline-block w-6 h-px bg-black/30 dark:bg-white/30 group-hover:w-12 group-hover:bg-black dark:group-hover:bg-white transition-all duration-500" />
                </Link>
              ))}
            </div>
          </section>
        );
      })()}
    </div>
  );
}
