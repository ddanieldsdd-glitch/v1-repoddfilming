import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { tr } from "../lib/i18n";
import { VideoPlayer } from "./VideoPlayer";
import { pauseAllExcept, resumePlayer } from "../lib/videoStore";
import { cloudinaryResponsive, CARD_PRESETS, optimizeCloudinaryUrl } from "../lib/cloudinary";
import { getCardRecognitions } from "../lib/recognitions";

const isVideoUrl = (url) =>
  /vimeo\.com|youtube\.com|youtu\.be/.test(String(url || ""));

const isYoutubeUrl = (url) =>
  /youtube\.com|youtu\.be/.test(String(url || ""));

export const ProjectCard = ({
  project,
  lang,
  eager = false,
  compact = false,
  index,
  aspectClass = "aspect-video",
  // fill: la tarjeta rellena la altura del contenedor padre (para layout editorial)
  fill = false,
  // alwaysPlay: el vídeo arranca en cuanto la tarjeta entra en viewport
  alwaysPlay = false,
  // cardSurface: 'home' | 'work' — muestra premios en tarjeta; al hover → director + tipo
  cardSurface = null,
  /** Still concreto (home): recorta al frame con object-cover, sin bandas. */
  imageOverride = "",
}) => {
  const [inView, setInView]           = useState(false);
  const [playInView, setPlayInView]   = useState(false);
  const [hovered, setHovered]         = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const cardRef      = useRef(null);
  const touchActive  = useRef(false);

  const previewKey = `card-preview-${project.slug}`;
  const heroKey    = "hero-showreel";

  const rawPreviewUrl =
    project.preview_url ||
    (isVideoUrl(project.cover) ? project.cover : null);

  // YouTube no se previsualiza en tarjetas (embed inestable); solo imagen estática
  const previewUrl =
    rawPreviewUrl && !isYoutubeUrl(rawPreviewUrl) ? rawPreviewUrl : null;

  const coverIsImage  = project.cover && !isVideoUrl(project.cover);
  const imageUrl      = imageOverride || (coverIsImage ? project.cover : project.poster);
  const cardImage     = imageUrl
    ? cloudinaryResponsive(
        imageUrl,
        cardSurface === "home"
          ? { widths: [480, 720, 1080, 1440, 1800], sizes: "(min-width: 1024px) 50vw, 100vw", quality: "good" }
          : eager ? CARD_PRESETS.eager : CARD_PRESETS.lazy,
      )
    : null;

  const recognitions = getCardRecognitions(project, cardSurface);
  const hasCardRecognitions = cardSurface && recognitions.length > 0;
  const laurelWidth = cardSurface === "home" ? (compact ? 88 : 96) : compact ? 64 : 80;
  const laurelUrl = (url) => optimizeCloudinaryUrl(url, { width: laurelWidth, quality: "best" });
  const laurelSizeCls = cardSurface === "home"
    ? compact
      ? "h-4 max-w-[26px]"
      : "h-5 sm:h-[22px] md:h-6 max-w-[32px] sm:max-w-[36px]"
    : compact
      ? "h-3.5 max-w-[22px]"
      : "h-4 sm:h-[18px] md:h-5 max-w-[26px] sm:max-w-[30px]";

  // Observer 1: preloading (wide margin — carga antes de entrar en pantalla)
  useEffect(() => {
    const el = cardRef.current;
    if (!el || !previewUrl) return undefined;
    const obs = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting),
      { rootMargin: "320px 0px", threshold: 0.01 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [previewUrl]);

  // Observer 2: autoplay (solo cuando la tarjeta es realmente visible)
  useEffect(() => {
    if (!alwaysPlay || !previewUrl) return undefined;
    const el = cardRef.current;
    if (!el) return undefined;
    const obs = new IntersectionObserver(
      ([e]) => setPlayInView(e.isIntersecting),
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [alwaysPlay, previewUrl]);

  // Con alwaysPlay el VideoPlayer permanece montado aunque la tarjeta esté
  // oculta por el filtro de categoría, evitando así reiniciar la reproducción.
  const shouldPreload = Boolean(previewUrl && (alwaysPlay || inView || hovered));
  const shouldPlay    = Boolean(previewUrl && (hovered || (alwaysPlay && playInView)));

  const onMouseEnter = () => {
    setHovered(true);
    if (previewUrl && !alwaysPlay) pauseAllExcept(previewKey);
  };

  const onMouseLeave = () => {
    if (touchActive.current) return;
    setHovered(false);
    if (!alwaysPlay) {
      setPreviewVisible(false);
      if (previewUrl) resumePlayer(heroKey);
    }
  };

  const onTouchStart = () => {
    touchActive.current = true;
    setHovered(true);
    if (previewUrl && !alwaysPlay) pauseAllExcept(previewKey);
  };

  const onTouchEnd = () => {
    touchActive.current = false;
    window.setTimeout(() => {
      if (!touchActive.current) {
        setHovered(false);
        if (!alwaysPlay) {
          setPreviewVisible(false);
          if (previewUrl) resumePlayer(heroKey);
        }
      }
    }, 120);
  };

  const shapeSeed = typeof index === "number"
    ? index
    : project.slug.length + project.title.length;
  const organicRadius = compact
    ? "rounded-[1.35rem] md:rounded-[1.65rem]"
    : shapeSeed % 3 === 0
      ? "rounded-[1.75rem] md:rounded-[2.25rem]"
      : shapeSeed % 3 === 1
        ? "rounded-[1.5rem] md:rounded-[2rem]"
        : "rounded-[1.65rem] md:rounded-[2.1rem]";

  // fill=true: la celda del grid manda; object-cover evita bandas negras
  const sizeClass = fill ? "h-full min-h-[200px]" : aspectClass;

  return (
    <Link
      ref={cardRef}
      to={`/project/${project.slug}`}
      data-testid={`project-card-${project.slug}`}
      className={`group block cursor-pointer apple-tv-card h-full ${fill ? "" : ""}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        className={`relative overflow-hidden bg-neutral-950 ${sizeClass} w-full shadow-[0_18px_50px_-28px_rgba(0,0,0,0.85)] ring-1 ring-white/10 transition-all duration-500 ease-out group-hover:scale-[1.02] group-hover:shadow-[0_28px_70px_-24px_rgba(0,0,0,0.9)] group-hover:ring-white/20 group-active:scale-[0.99] ${organicRadius}`}
      >
        <div className="absolute inset-0 z-0 bg-neutral-950" />

        {cardImage && (
          <img
            src={cardImage.src}
            srcSet={cardImage.srcSet}
            sizes={cardImage.sizes}
            alt={project.title}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={eager ? "high" : "auto"}
            width={16}
            height={9}
            className={`absolute inset-0 z-[3] w-full h-full object-cover transition-all duration-300 ease-out ${
              previewVisible ? "opacity-0 scale-[1.03]" : "opacity-100 scale-100"
            }`}
          />
        )}

        {shouldPreload && previewUrl && (
          <VideoPlayer
            url={previewUrl}
            playerKey={previewKey}
            background
            muted
            playing={shouldPlay}
            loop
            className={`absolute inset-0 z-[1] w-full h-full bg-black transition-opacity duration-300 ${
              previewVisible ? "opacity-100" : "opacity-0"
            }`}
            testId={`card-preview-${project.slug}`}
            interactive={false}
            onPlay={() => setPreviewVisible(true)}
          />
        )}

        {/* Gradiente permanente para legibilidad de la info */}
        <div className="pointer-events-none absolute inset-0 z-[4] bg-gradient-to-t from-black/90 via-black/15 to-transparent" />

        {/* Info overlay — título siempre visible; detalles solo en hover */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] p-4 md:p-5">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              {typeof index === "number" && (
                <span
                  className={`block mb-1 text-[10px] tracking-[0.28em] uppercase text-white/50 transition-all duration-300 ${
                    hovered ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {String(index + 1).padStart(3, "0")}
                </span>
              )}
              <h3
                className={`${
                  compact ? "text-sm md:text-base" : "text-base md:text-lg lg:text-xl"
                } font-light tracking-tight text-white leading-tight truncate`}
              >
                {project.title}
              </h3>
              <div
                className={`relative mt-1 ${
                  hasCardRecognitions ? "h-5 sm:h-[22px] md:h-6" : "min-h-[14px] md:min-h-[16px]"
                }`}
              >
                {hasCardRecognitions && (
                  <div
                    className={`absolute inset-0 flex items-center gap-0.5 sm:gap-1 transition-all duration-300 ${
                      hovered ? "opacity-0 translate-y-1" : "opacity-90 translate-y-0"
                    }`}
                    aria-hidden={hovered}
                  >
                    {recognitions.map((item, i) => (
                      <img
                        key={`${item.url}-${i}`}
                        src={laurelUrl(item.url)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className={`w-auto object-contain drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)] ${laurelSizeCls}`}
                      />
                    ))}
                  </div>
                )}
                <p
                  className={`${
                    hasCardRecognitions ? "absolute inset-0 flex items-center" : ""
                  } text-[9px] md:text-[10px] tracking-[0.22em] uppercase text-white/60 truncate transition-all duration-300 ${
                    hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                  }`}
                >
                  {project.director ? `${project.director} · ` : ""}{tr(project.type, lang)}
                </p>
              </div>
            </div>
            <span
              className={`mb-0.5 shrink-0 text-[10px] md:text-[11px] tracking-[0.24em] uppercase text-white/55 transition-all duration-300 ${
                hovered ? "opacity-100" : "opacity-0"
              }`}
            >
              {project.year}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
