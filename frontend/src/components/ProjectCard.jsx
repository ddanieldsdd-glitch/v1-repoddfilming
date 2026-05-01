import { Link } from "react-router-dom";
import { tr } from "../lib/i18n";

export const ProjectCard = ({ project, lang, eager = false }) => {
  return (
    <Link
      to={`/project/${project.slug}`}
      data-testid={`project-card-${project.slug}`}
      className="group block"
    >
      <div className="overflow-hidden bg-neutral-100 aspect-[4/3] mb-4">
        {project.cover ? (
          <img
            src={project.cover}
            alt={project.title}
            loading={eager ? "eager" : "lazy"}
            className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full bg-neutral-200" />
        )}
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-base md:text-lg tracking-tight text-black leading-tight">
          {project.title}
        </h3>
        <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-500 shrink-0">
          {project.year}
        </span>
      </div>
      <p className="text-[12px] tracking-[0.18em] uppercase text-neutral-500 mt-1">
        {project.director} · {tr(project.type, lang)}
      </p>
    </Link>
  );
};
