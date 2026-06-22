import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { X, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { VideoPlayer } from "../components/VideoPlayer";
import { extractVimeoId, getVimeoPosterUrl } from "../lib/vimeo";
import { getSiteDescription } from "../lib/seo";
import { getPlayer } from "../lib/videoStore";

function ShowreelControls({ lang, muted, onToggleMute, fullscreen, onToggleFullscreen }) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      <button
        type="button"
        onClick={onToggleMute}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/75 backdrop-blur-md transition hover:border-white/35 hover:bg-white/10 hover:text-white"
        aria-label={muted ? (lang === "es" ? "Activar sonido" : "Unmute") : (lang === "es" ? "Silenciar" : "Mute")}
      >
        {muted ? <VolumeX className="h-4 w-4" strokeWidth={1.5} /> : <Volume2 className="h-4 w-4" strokeWidth={1.5} />}
      </button>
      <button
        type="button"
        onClick={onToggleFullscreen}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/75 backdrop-blur-md transition hover:border-white/35 hover:bg-white/10 hover:text-white"
        aria-label={fullscreen ? (lang === "es" ? "Salir de pantalla completa" : "Exit fullscreen") : (lang === "es" ? "Pantalla completa" : "Fullscreen")}
      >
        {fullscreen ? <Minimize className="h-4 w-4" strokeWidth={1.5} /> : <Maximize className="h-4 w-4" strokeWidth={1.5} />}
      </button>
    </div>
  );
}

export default function Showreel() {
  const content = useContent();
  const [lang] = useLang();
  const playerWrapRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const url = content.site?.showreel_url;
  const vimeoId = extractVimeoId(url);
  const poster = getVimeoPosterUrl(url);
  const name = content.site?.name || "Dani Díaz";
  const title = `${tr(T.hero.showreel, lang)} — ${name}`;
  const description =
    lang === "es"
      ? `Showreel de ${name}, Director de Fotografía. Selección de trabajos en ficción, documental, publicidad y videoclips.`
      : `Showreel by ${name}, Cinematographer. A selection of fiction, documentary, commercials and music videos.`;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !document.fullscreenElement) window.history.back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!vimeoId) return undefined;

    const thumb = poster || content.site?.logo_white || "";
    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": "https://ddanidiaz.com/showreel#webpage",
          url: "https://ddanidiaz.com/showreel",
          name: title,
          description: getSiteDescription(content, lang) || description,
          inLanguage: lang,
        },
        {
          "@type": "VideoObject",
          "@id": "https://ddanidiaz.com/showreel#video",
          name: title,
          description,
          thumbnailUrl: thumb,
          contentUrl: `https://vimeo.com/${vimeoId}`,
          embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
          url: "https://ddanidiaz.com/showreel",
          uploadDate: "2024-01-01T00:00:00+00:00",
        },
      ],
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "showreel-jsonld";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => document.getElementById("showreel-jsonld")?.remove();
  }, [content, lang, vimeoId, poster, title, description, name]);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleMute = useCallback(async () => {
    const player = getPlayer("showreel-page");
    if (!player) return;
    const next = !muted;
    try {
      await player.setMuted(next);
      setMuted(next);
    } catch {}
  }, [muted]);

  const toggleFullscreen = useCallback(async () => {
    const el = playerWrapRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {}
  }, []);

  const handlePlayerReady = useCallback(() => {
    const player = getPlayer("showreel-page");
    if (!player) return;
    try {
      player.setMuted(false).catch(() => {});
      player.setVolume(0.85).catch(() => {});
      player.play().catch(() => {});
    } catch {}
  }, []);

  if (!url) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <Link
          to="/"
          className="text-sm text-white/50 hover:text-white border-b border-white/30 pb-1"
          aria-label={lang === "es" ? "Volver al inicio" : "Back to home"}
        >
          ←
        </Link>
      </div>
    );
  }

  return (
    <div
      data-testid="showreel-page"
      className="fixed inset-0 z-40 flex flex-col bg-black"
    >
      <h1 className="sr-only">{title}</h1>

      <Link
        to="/"
        className="absolute right-4 top-4 sm:right-6 sm:top-6 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/70 backdrop-blur-md transition hover:border-white/40 hover:text-white"
        aria-label={lang === "es" ? "Cerrar showreel" : "Close showreel"}
      >
        <X className="h-4 w-4" strokeWidth={1.5} />
      </Link>

      <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-4 px-2 pt-14 pb-2 sm:px-8 sm:pt-16 sm:pb-4">
        <div
          ref={playerWrapRef}
          className="hero-player relative w-full max-w-5xl aspect-video max-h-[calc(100svh-9rem)] overflow-hidden rounded-xl sm:rounded-2xl bg-black shadow-[0_32px_100px_-24px_rgba(0,0,0,0.95)] ring-1 ring-white/10"
        >
          <VideoPlayer
            url={url}
            playerKey="showreel-page"
            autoplay
            muted={false}
            className="absolute inset-0 h-full w-full"
            testId="showreel-player"
            interactive
            onReady={handlePlayerReady}
          />
        </div>
        <ShowreelControls
          lang={lang}
          muted={muted}
          onToggleMute={toggleMute}
          fullscreen={fullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
      </div>

      <p className="pointer-events-none pb-4 text-center text-[9px] tracking-[0.24em] uppercase text-white/35 sm:pb-6">
        {lang === "es"
          ? "Controles de Vimeo · volumen, progreso y pantalla completa"
          : "Vimeo controls · volume, progress and fullscreen"}
      </p>
    </div>
  );
}
