import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { tr } from "../lib/i18n";
import { VimeoEmbed } from "./VimeoEmbed";

const isVideoUrl = (url) =>
  /vimeo\.com|youtube\.com|youtu\.be/.test(String(url || ""));

export const ProjectCard = ({ project, lang, eager = false, compact = false }) => {
  const [hover, setHover] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  const previewUrl =
    project.preview_url ||
    (isVideoUrl(project.cover) ? project.cover : null);

  const coverIsImage = project.cover && !isVideoUrl(project.cover);

  const onEnter = () => {
    if (!previewUrl) return;
    timer.current = setTimeout(() => setHover(true), 150);
  };
  const onLeave = () => {
    if (timer.current) clearTimeout(timer.current);
    setHover(false);
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
        {coverIsImage && (
          <img
            src={project.cover}
            alt={project.title}
            loading={eager ? "eager" : "lazy"}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              hover ? "opacity-0" : "opacity-100"
            }`}
          />
        )}
        {hover && previewUrl && (
          <VimeoEmbed
            url={previewUrl}
            autoplay
            background
            muted
            interactive={false}
            className="absolute inset-0 w-full h-full"
          />
        )}
        {!coverIsImage && !hover && previewUrl && (
          <div className="absolute inset-0 flex items-center justify-center text-white/40 text-[11px] tracking-[0.3em] uppercase pointer-events-none">
            Hover to play
          </div>
        )}
      </div>

      <div className={`mt-4 md:mt-5 flex items-baseline justify-between gap-6 px-1 ${compact ? "" : ""}`}>
        <div className="min-w-0">
          <h3 className={`${compact ? "text-base md:text-lg" : "text-xl md:text-2xl lg:text-3xl"} tracking-tight font-light text-black dark:text-white leading-tight truncate`}>
            {project.title}
          </h3>
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
