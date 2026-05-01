import { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, ArrowRight } from "lucide-react";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { VimeoEmbed } from "../components/VimeoEmbed";

const isVideoUrl = (url) =>
  /vimeo\.com|youtube\.com|youtu\.be/.test(String(url || ""));

export default function ProjectDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const content = useContent();
  const [lang] = useLang();
  const [showBts, setShowBts] = useState(false);

  const projects = content.projects || [];
  const idx = projects.findIndex((p) => p.slug === slug);
  const project = idx >= 0 ? projects[idx] : null;
  const next = useMemo(
    () => (idx >= 0 ? projects[(idx + 1) % projects.length] : null),
    [idx, projects]
  );

  if (!project) {
    return (
      <div className="pt-40 px-6 md:px-12 lg:px-16 min-h-[60vh]" data-testid="project-not-found">
        <p className="text-neutral-500 mb-6">{tr(T.project.notFound, lang)}</p>
        <Link to="/work" className="text-sm border-b border-black pb-1">
          {tr(T.project.back, lang)}
        </Link>
      </div>
    );
  }

  const coverIsVideo = isVideoUrl(project.cover);

  return (
    <div data-testid="project-detail-page" className="bg-white">
      {/* HERO MEDIA */}
      <section className="pt-24 md:pt-28">
        <div className="bg-black">
          {coverIsVideo ? (
            <VimeoEmbed
              url={project.cover}
              className="aspect-video w-full"
              testId="project-cover-video"
            />
          ) : (
            <img
              src={project.cover}
              alt={project.title}
              data-testid="project-cover-image"
              className="w-full h-[60vh] md:h-[80vh] object-cover"
            />
          )}
        </div>
      </section>

      {/* META */}
      <section className="px-6 md:px-12 lg:px-16 py-16 md:py-24">
        <button
          onClick={() => navigate(-1)}
          data-testid="project-back-btn"
          className="inline-flex items-center gap-2 text-[11px] tracking-[0.28em] uppercase text-neutral-500 hover:text-black mb-12"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} /> {tr(T.project.back, lang)}
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12">
          <div className="md:col-span-8">
            <p className="text-[11px] tracking-[0.32em] uppercase text-neutral-500 mb-4">
              {tr(project.type, lang)} — {project.year}
            </p>
            <h1
              data-testid="project-title"
              className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[0.95]"
            >
              {project.title}
            </h1>
            <p className="mt-8 md:mt-10 text-base md:text-lg leading-relaxed text-neutral-700 max-w-2xl whitespace-pre-line">
              {tr(project.synopsis, lang)}
            </p>

            {project.external_link && (
              <a
                href={project.external_link}
                target="_blank"
                rel="noreferrer"
                data-testid="project-external-link"
                className="mt-10 inline-flex items-center gap-2 border border-black px-6 py-3 text-[11px] tracking-[0.28em] uppercase hover:bg-black hover:text-white transition-colors"
              >
                {tr(T.project.external, lang)} <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              </a>
            )}
          </div>

          <aside className="md:col-span-4 md:border-l md:border-black/10 md:pl-10 pt-6 md:pt-2">
            <dl className="space-y-6 text-sm">
              <div>
                <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 mb-1">
                  {tr(T.project.director, lang)}
                </dt>
                <dd className="text-black">{project.director}</dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 mb-1">
                  {tr(T.project.year, lang)}
                </dt>
                <dd className="text-black">{project.year}</dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 mb-1">
                  {tr(T.project.type, lang)}
                </dt>
                <dd className="text-black">{tr(project.type, lang)}</dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 mb-1">
                  {tr(T.project.format, lang)}
                </dt>
                <dd className="text-black">{project.format}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      {/* STILLS */}
      {project.stills && project.stills.length > 0 && (
        <section
          data-testid="project-stills"
          className="px-6 md:px-12 lg:px-16 pb-16 md:pb-24"
        >
          <p className="text-[11px] tracking-[0.32em] uppercase text-neutral-500 mb-8">
            {tr(T.project.stills, lang)}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {project.stills.map((src, i) => (
              <div
                key={i}
                className={`bg-neutral-100 overflow-hidden ${
                  i % 3 === 0 ? "md:col-span-2 aspect-[21/9]" : "aspect-[3/2]"
                }`}
              >
                <img
                  src={src}
                  alt={`${project.title} still ${i + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* BTS */}
      {project.bts && project.bts.length > 0 && (
        <section className="px-6 md:px-12 lg:px-16 pb-16 md:pb-24 border-t border-black/10 pt-12">
          <button
            onClick={() => setShowBts((v) => !v)}
            data-testid="project-bts-toggle"
            className="flex items-center justify-between w-full"
          >
            <span className="text-[11px] tracking-[0.32em] uppercase text-neutral-500">
              {tr(T.project.bts, lang)} · {project.bts.length}
            </span>
            <span className="text-[11px] tracking-[0.28em] uppercase border-b border-black pb-0.5">
              {showBts ? tr(T.project.hideBts, lang) : tr(T.project.showBts, lang)}
            </span>
          </button>
          {showBts && (
            <div
              data-testid="project-bts-grid"
              className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
            >
              {project.bts.map((src, i) => (
                <div key={i} className="bg-neutral-100 overflow-hidden aspect-[4/5]">
                  <img src={src} alt="BTS" loading="lazy" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* NEXT */}
      {next && (
        <section className="px-6 md:px-12 lg:px-16 py-16 md:py-24 border-t border-black/10">
          <Link
            to={`/project/${next.slug}`}
            data-testid="project-next-link"
            className="group flex items-baseline justify-between gap-6"
          >
            <div>
              <p className="text-[11px] tracking-[0.32em] uppercase text-neutral-500 mb-2">
                {tr(T.project.next, lang)}
              </p>
              <p className="text-2xl md:text-4xl tracking-tight font-light group-hover:opacity-60 transition">
                {next.title}
              </p>
            </div>
            <ArrowRight className="w-6 h-6 md:w-8 md:h-8 group-hover:translate-x-2 transition-transform" strokeWidth={1} />
          </Link>
        </section>
      )}
    </div>
  );
}
