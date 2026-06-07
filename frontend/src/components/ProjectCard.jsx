import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { tr } from "../lib/i18n";
import { VideoPlayer } from "./VideoPlayer";
import { pauseAllExcept, resumePlayer } from "../lib/videoStore";

const isVideoUrl = (url) =>
  /vimeo\.com|youtube\.com|youtu\.be/.test(String(url || ""));

export const ProjectCard = ({ project, lang, eager = false, compact = false, index }) => {
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const cardRef = useRef(null);
  const touchActiveRef = useRef(false);

  const previewKey = `card-preview-${project.slug}`;
  const heroKey = "hero-showreel";

  const previewUrl =
    project.preview_url ||
    (isVideoUrl(project.cover) ? project.cover : null);

  const coverIsImage = project.cover && !isVideoUrl(project.cover);
  const fallbackImage = coverIsImage ? project.cover : project.poster;

  const shouldPreload = Boolean(previewUrl && (inView || hovered));
  const shouldPlay = Boolean(previewUrl && hovered);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || !previewUrl) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "320px 0px", threshold: 0.01 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [previewUrl]);

  // Hover siempre activo, independientemente de si hay video
  const onMouseEnter = () => {
    setHovered(true);
    if (previewUrl) pauseAllExcept(previewKey);
  };

  const onMouseLeave = () => {
    if (touchActiveRef.current) return;
    setHovered(false);
    setPreviewVisible(false);
    if (previewUrl) resumePlayer(heroKey);
  };

  const onTouchStart = () => {
    touchActiveRef.current = true;
    setHovered(true);
    if (previewUrl) pauseAllExcept(previewKey);
  };

  const onTouchEnd = () => {
    touchActiveRef.current = false;
    window.setTimeout(() => {
      if (!touchActiveRef.current) {
        setHovered(false);
        setPreviewVisible(false);
        if (previewUrl) resumePlayer(heroKey);
      }
    }, 120);
  };

  const shapeSeed =
    typeof index === "number" ? index : project.slug.length + project.title.length;
  const organicRadius = compact
    ? "rounded-[1.35rem] md:rounded-[1.65rem]"
    : shapeSeed % 3 === 0
      ? "rounded-[1.75rem] md:rounded-[2.25rem]"
      : shapeSeed % 3 === 1
        ? "rounded-[1.5rem] md:rounded-[2rem]"
        : "rounded-[1.65rem] md:rounded-[2.1rem]";

  return (
    <Link
      ref={cardRef}
      to={`/project/${project.slug}`}
      data-testid={`project-card-${project.slug}`}
      className="group block cursor-pointer apple-tv-card"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        className={`relative overflow-hidden bg-neutral-950 aspect-video w-full shadow-[0_18px_50px_-28px_rgba(0,0,0,0.85)] ring-1 ring-white/10 transition-all duration-500 ease-out group-hover:scale-[1.02] group-hover:shadow-[0_28px_70px_-24px_rgba(0,0,0,0.9)] group-hover:ring-white/20 group-active:scale-[0.99] ${organicRadius}`}
      >
        <div className="absolute inset-0 z-0 bg-neutral-950" />

        {fallbackImage && (
          <img
            src={fallbackImage}
            alt={project.title}
            loading={eager ? "eager" : "lazy"}
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

        {/* Gradiente siempre presente para legibilidad */}
        <div className="pointer-events-none absolute inset-0 z-[4] bg-gradient-to-t from-black/90 via-black/15 to-transparent" />

        {/* Info overlay: opacidad 0 en reposo → visible en hover */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-[5] p-4 md:p-5 transition-all duration-300 ease-out ${
            hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              {typeof index === "number" && (
                <span className="block mb-1 text-[10px] tracking-[0.28em] uppercase text-white/50">
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
              <p className="text-[9px] md:text-[10px] tracking-[0.22em] uppercase text-white/60 mt-1 truncate">
                {project.director ? `${project.director} · ` : ""}{tr(project.type, lang)}
              </p>
            </div>
            <span className="mb-0.5 shrink-0 text-[10px] md:text-[11px] tracking-[0.24em] uppercase text-white/55">
              {project.year}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
