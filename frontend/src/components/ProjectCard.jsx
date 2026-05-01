import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { tr } from "../lib/i18n";
import { VimeoEmbed } from "./VimeoEmbed";

const isVideoUrl = (url) =>
  /vimeo\.com|youtube\.com|youtu\.be/.test(String(url || ""));

export const ProjectCard = ({ project, lang, eager = false }) => {
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
      className="group block"
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
            className="absolute inset-0 w-full h-full"
          />
        )}
        {!coverIsImage && !hover && previewUrl && (
          <div className="absolute inset-0 flex items-center justify-center text-white/40 text-[11px] tracking-[0.3em] uppercase">
            Hover to play
          </div>
        )}
      </div>

      <div className="mt-5 md:mt-6 flex items-baseline justify-between gap-6 px-1">
        <div className="min-w-0">
          <h3 className="text-xl md:text-2xl lg:text-3xl tracking-tight font-light text-black leading-tight truncate">
            {project.title}
          </h3>
          <p className="text-[11px] tracking-[0.22em] uppercase text-neutral-500 mt-2">
            {project.director} · {tr(project.type, lang)}
          </p>
        </div>
        <span className="text-[11px] tracking-[0.24em] uppercase text-neutral-500 shrink-0">
          {project.year}
        </span>
      </div>
    </Link>
  );
};
