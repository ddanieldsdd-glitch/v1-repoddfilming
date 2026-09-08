import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { T, tr } from "../lib/i18n";
import { VideoPlayer } from "./VideoPlayer";
import {
  HOME_SHOWREEL_KEY,
  pauseAllExcept,
  resumePlayer,
} from "../lib/videoStore";
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
  /** Still concreto (home). */
  imageOverride = "",
  /** cover recorta al marco; contain muestra el fotograma entero (sin ampliar). */
  fit,
  /** Relación de aspecto del still (ancho/alto). */
  ratio,
  /** Recorte 16:9 para la miniatura Vimeo al hover/reproducir. */
  previewCrop,
  /** Relación ancho/alto real del preview Vimeo. */
  previewVideoRatio,
}) => {
  const [inView, setInView]           = useState(false);
  const [playInView, setPlayInView]   = useState(false);
  const [hovered, setHovered]         = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const cardRef      = useRef(null);
  const touchActive  = useRef(false);

  const previewKey = `card-preview-${project.slug}`;

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
      if (previewUrl) resumePlayer(HOME_SHOWREEL_KEY);
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
          if (previewUrl) resumePlayer(HOME_SHOWREEL_KEY);
        }
      }
    }, 120);
  };

  const contain = (fit ?? (cardSurface === "work" ? "contain" : "cover")) === "contain";
  const isHome = cardSurface === "home";
  const radiusClass = compact
    ? "rounded-[0.875rem] md:rounded-[1rem]"
    : "rounded-[1rem] md:rounded-[1.25rem]";
  const sizeClass = fill ? "h-full min-h-0" : aspectClass;
  const imgW = ratio ? Math.round(ratio * 100) : 16;
  const imgH = 100;

  return (
    <Link
      ref={cardRef}
      to={`/project/${project.slug}`}
      data-testid={`project-card-${project.slug}`}
      className="group block cursor-pointer apple-tv-card h-full"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        className={`relative overflow-hidden bg-neutral-950 ${sizeClass} w-full ring-1 transition-[box-shadow,outline-color] duration-500 ease-out ${
          isHome
            ? "ring-white/[0.06] group-hover:ring-white/[0.12]"
            : "ring-white/[0.08] shadow-[0_18px_45px_-32px_rgba(0,0,0,0.9)] group-hover:ring-white/15"
        } ${radiusClass}`}
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
            width={imgW}
            height={imgH}
            className={`absolute inset-0 z-[3] w-full h-full ${contain ? "object-contain" : "object-cover"} transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${
              previewVisible
                ? contain || isHome
                  ? "opacity-0 scale-[1.02]"
                  : "opacity-0 scale-[1.03]"
                : "opacity-100 scale-100 group-hover:scale-[1.02] motion-reduce:group-hover:scale-100"
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
            cover
            crop={previewCrop}
            previewVideoRatio={previewVideoRatio ?? project.preview_video_ratio}
            className={`absolute inset-0 z-[1] w-full h-full bg-black transition-opacity duration-300 ${
              previewVisible ? "opacity-100" : "opacity-0"
            }`}
            testId={`card-preview-${project.slug}`}
            interactive={false}
            onPlay={() => {
              if (shouldPlay) setPreviewVisible(true);
            }}
            onPause={() => {
              if (!shouldPlay) setPreviewVisible(false);
            }}
          />
        )}

        {/* Gradiente permanente para legibilidad de la info */}
        <div className="pointer-events-none absolute inset-0 z-[4] bg-gradient-to-t from-black/80 via-black/5 to-transparent transition-colors duration-500 group-hover:from-black/90" />

        {/* Info editorial: título + metadatos persistentes; CTA y director al hover. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] p-3.5 sm:p-4 md:p-5">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0 flex-1">
              {typeof index === "number" && (
                <span
                  className={`block mb-1.5 text-[9px] tracking-[0.16em] uppercase text-white/50 transition-all duration-500 motion-reduce:transition-none ${
                    hovered ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {String(index + 1).padStart(3, "0")}
                </span>
              )}
              {hasCardRecognitions && (
                <div className="mb-2 flex items-center gap-1 opacity-85">
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
              <h3
                className={`${
                  compact ? "text-sm md:text-base" : "text-base sm:text-lg md:text-xl"
                } font-light tracking-[-0.02em] text-white leading-tight truncate transition-transform duration-500 ease-out group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0`}
              >
                {project.title}
              </h3>
              <p className="mt-1.5 text-[9px] md:text-[10px] tracking-[0.12em] uppercase text-white/65 truncate">
                {tr(project.type, lang)}{project.year ? ` · ${project.year}` : ""}
              </p>
              {project.director && (
                <p
                  className={`mt-1 text-[9px] text-white/50 truncate transition-[opacity,transform] duration-500 motion-reduce:transition-none ${
                    hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                  }`}
                >
                  {project.director}
                </p>
              )}
            </div>
            <span
              className="mb-0.5 flex shrink-0 items-center gap-1.5 text-[9px] tracking-[0.12em] uppercase text-white/70 opacity-70 transition-[opacity,transform] duration-500 md:translate-y-1 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 motion-reduce:transition-none"
            >
              <span className="hidden lg:inline">{tr(T.project.external, lang)}</span>
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
