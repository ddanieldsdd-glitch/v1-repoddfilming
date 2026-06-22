import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { X, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { VideoPlayer } from "../components/VideoPlayer";
import { extractVimeoId, getVimeoPosterUrl } from "../lib/vimeo";
import { getSiteDescription } from "../lib/seo";
import { getPlayer } from "../lib/videoStore";

function ControlButton({ onClick, label, ariaLabel, active = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={`flex min-h-12 min-w-[7.5rem] items-center justify-center gap-2 rounded-full border px-4 text-[11px] font-medium tracking-[0.12em] uppercase backdrop-blur-md transition active:scale-95 ${
        active
          ? "border-white/40 bg-white/15 text-white"
          : "border-white/20 bg-black/50 text-white/90 hover:border-white/35 hover:bg-black/70"
      }`}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

export default function Showreel() {
  const content = useContent();
  const [lang] = useLang();
  const playerWrapRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
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
    const syncExpanded = () => {
      const nativeFs = Boolean(document.fullscreenElement);
      setExpanded(nativeFs);
    };
    document.addEventListener("fullscreenchange", syncExpanded);
    document.addEventListener("webkitfullscreenchange", syncExpanded);
    return () => {
      document.removeEventListener("fullscreenchange", syncExpanded);
      document.removeEventListener("webkitfullscreenchange", syncExpanded);
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !document.fullscreenElement) {
        if (expanded) setExpanded(false);
        else window.history.back();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

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

  const requestNativeFullscreen = useCallback(async (el) => {
    if (!el) return false;
    const req =
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.webkitEnterFullscreen;
    if (!req) return false;
    try {
      await req.call(el);
      return true;
    } catch {
      return false;
    }
  }, []);

  const exitNativeFullscreen = useCallback(async () => {
    const exit =
      document.exitFullscreen ||
      document.webkitExitFullscreen ||
      document.webkitCancelFullScreen;
    if (!exit) return false;
    try {
      await exit.call(document);
      return true;
    } catch {
      return false;
    }
  }, []);

  const toggleMute = useCallback(async () => {
    const player = getPlayer("showreel-page");
    if (!player) return;
    const next = !muted;
    try {
      await player.setMuted(next);
      if (!next) await player.setVolume(0.85);
      setMuted(next);
    } catch {}
  }, [muted]);

  const toggleExpand = useCallback(async () => {
    const player = getPlayer("showreel-page");
    const el = playerWrapRef.current;

    if (expanded) {
      try {
        if (player?.exitFullscreen) await player.exitFullscreen();
      } catch {}
      await exitNativeFullscreen();
      setExpanded(false);
      return;
    }

    try {
      if (player?.requestFullscreen) {
        await player.requestFullscreen();
        setExpanded(true);
        return;
      }
    } catch {}

    if (await requestNativeFullscreen(el)) {
      setExpanded(true);
      return;
    }

    setExpanded(true);
  }, [expanded, exitNativeFullscreen, requestNativeFullscreen]);

  const handlePlayerReady = useCallback(() => {
    const player = getPlayer("showreel-page");
    if (!player) return;
    try {
      player.setMuted(false).catch(() => {});
      player.setVolume(0.85).catch(() => {});
      player.play().catch(() => {});
      setMuted(false);
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

  const muteLabel = muted
    ? lang === "es"
      ? "Sonido"
      : "Unmute"
    : lang === "es"
      ? "Silenciar"
      : "Mute";

  const expandLabel = expanded
    ? lang === "es"
      ? "Reducir"
      : "Shrink"
    : lang === "es"
      ? "Ampliar"
      : "Expand";

  return (
    <div
      data-testid="showreel-page"
      className="fixed inset-0 z-40 flex flex-col bg-black"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <h1 className="sr-only">{title}</h1>

      <Link
        to="/"
        className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[60] flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/80 backdrop-blur-md transition hover:border-white/40 hover:text-white sm:right-6"
        aria-label={lang === "es" ? "Cerrar showreel" : "Close showreel"}
      >
        <X className="h-4 w-4" strokeWidth={1.5} />
      </Link>

      <div className="flex flex-1 min-h-0 items-stretch justify-center sm:items-center sm:px-6 sm:py-16">
        <div
          ref={playerWrapRef}
          className={`hero-player showreel-player relative flex min-h-0 w-full flex-col bg-black overflow-hidden ${
            expanded
              ? "fixed inset-0 z-[55] max-h-none rounded-none"
              : "h-full max-h-none flex-1 sm:h-auto sm:max-h-[calc(100svh-8rem)] sm:flex-none sm:aspect-video sm:max-w-5xl sm:rounded-2xl sm:shadow-[0_32px_100px_-24px_rgba(0,0,0,0.95)] sm:ring-1 sm:ring-white/10"
          }`}
        >
          {poster && !playing && (
            <img
              src={poster}
              alt=""
              className="absolute inset-0 z-[1] h-full w-full object-cover"
            />
          )}

          <div className="relative min-h-0 flex-1">
            <VideoPlayer
              url={url}
              playerKey="showreel-page"
              autoplay
              muted={false}
              className="absolute inset-0 h-full w-full"
              testId="showreel-player"
              interactive
              onReady={handlePlayerReady}
              onPlay={() => setPlaying(true)}
            />
          </div>

          {/* Barra táctil — siempre visible encima del vídeo (móvil + desktop) */}
          <div
            className="relative z-30 flex shrink-0 items-center justify-center gap-3 border-t border-white/10 bg-black/85 px-4 py-3 backdrop-blur-md sm:gap-4 sm:py-4"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
          >
            <ControlButton
              onClick={toggleMute}
              label={muteLabel}
              ariaLabel={muteLabel}
              active={muted}
            >
              {muted ? (
                <VolumeX className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              ) : (
                <Volume2 className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              )}
            </ControlButton>
            <ControlButton
              onClick={toggleExpand}
              label={expandLabel}
              ariaLabel={expandLabel}
              active={expanded}
            >
              {expanded ? (
                <Minimize className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              ) : (
                <Maximize className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              )}
            </ControlButton>
          </div>
        </div>
      </div>
    </div>
  );
}
