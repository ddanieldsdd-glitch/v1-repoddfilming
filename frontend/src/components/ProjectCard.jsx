import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { tr } from "../lib/i18n";
import { VideoPlayer } from "./VideoPlayer";
import { pauseAllExcept, resumePlayer, getPlayer } from "../lib/videoStore";

const isVideoUrl = (url) =>
  /vimeo\.com|youtube\.com|youtu\.be/.test(String(url || ""));

export const ProjectCard = ({ project, lang, eager = false, compact = false, index }) => {
  const [previewActive, setPreviewActive] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const timer = useRef(null);

  const previewKey = `card-preview-${project.slug}`;
  const heroKey = "hero-showreel";

  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  const previewUrl =
    project.preview_url ||
    (isVideoUrl(project.cover) ? project.cover : null);

  const coverIsImage = project.cover && !isVideoUrl(project.cover);
  const fallbackImage = coverIsImage ? project.cover : project.poster;

  const onEnter = () => {
    if (!previewUrl) return;
    setPreviewActive(true);
    timer.current = window.setTimeout(() => setPreviewReady(true), 50);
    // Pause the hero showreel so audio doesn't overlap
    pauseAllExcept(previewKey);
  };

  const onLeave = () => {
    if (timer.current) clearTimeout(timer.current);
    // Pause the preview player before unmounting
    const previewPlayer = getPlayer(previewKey);
    if (previewPlayer) {
      try {
        previewPlayer.pause().catch(() => {});
        previewPlayer.setMuted(true).catch(() => {});
      } catch {}
    }
    setPreviewActive(false);
    setPreviewReady(false);
    // Resume the hero showreel (play + unmute)
    resumePlayer(heroKey);
  };

  return (
    <Link
      to={`/project/${project.slug}`}
      data-testid={`project-card-${project.slug}`}
      className="group block cursor-pointer"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="relative overflow-hidden bg-black aspect-video w-full">
        <div className="absolute inset-0 z-0 bg-black" />
        {fallbackImage && (
          <img
            src={fallbackImage}
            alt={project.title}
            loading={eager ? "eager" : "lazy"}
            className={`absolute inset-0 z-[3] w-full h-full object-cover transition-all duration-500 ease-out ${
              previewReady ? "opacity-0 scale-[1.015]" : "opacity-100 scale-100"
            }`}
          />
        )}
        {previewActive && previewUrl && (
          <VideoPlayer
            url={previewUrl}
            playerKey={`card-preview-${project.slug}`}
            autoplay
            background
            className={`absolute inset-0 z-[1] w-full h-full bg-black transition-opacity duration-500 ${
              previewReady ? "opacity-100" : "opacity-0"
            }`}
            testId={`card-preview-${project.slug}`}
            interactive={false}
            onReady={() => {
              window.setTimeout(() => setPreviewReady(true), 300);
            }}
          />
        )}
        {!fallbackImage && !previewActive && previewUrl && (
          <div className="absolute inset-0 z-[2] flex items-center justify-center bg-black text-white/40 text-[11px] tracking-[0.3em] uppercase pointer-events-none">
            Hover to play
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/10" />
        {typeof index === "number" && (
          <span className="pointer-events-none absolute left-4 top-4 text-[10px] tracking-[0.28em] uppercase text-white/0 transition-colors duration-500 group-hover:text-white/70">
            {String(index + 1).padStart(3, "0")}
          </span>
        )}
      </div>

      <div className={`mt-4 md:mt-5 flex items-baseline justify-between gap-6 px-1 transition-transform duration-500 group-hover:translate-y-[-2px] ${compact ? "" : ""}`}>
        <div className="min-w-0">
          <div className="flex items-baseline gap-3">
            {typeof index === "number" && (
              <span className="text-[10px] tracking-[0.26em] uppercase text-neutral-400 dark:text-neutral-600 shrink-0">
                {String(index + 1).padStart(3, "0")}
              </span>
            )}
            <h3 className={`${compact ? "text-base md:text-lg" : "text-xl md:text-2xl lg:text-3xl"} tracking-tight font-light text-black dark:text-white leading-tight truncate`}>
              {project.title}
            </h3>
          </div>
          <p className="text-[10px] md:text-[11px] tracking-[0.22em] uppercase text-neutral-500 dark:text-neutral-400 mt-1.5">
            {project.director ? `${project.director} · ` : ""}{tr(project.type, lang)}
          </p>
        </div>
        <span className="text-[11px] tracking-[0.24em] uppercase text-neutral-500 dark:text-neutral-400 shrink-0">
          {project.year}
        </span>
      </div>
    </Link>
  );
};