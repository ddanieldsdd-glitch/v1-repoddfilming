import { useRef, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, ArrowRight, Volume2, VolumeX } from "lucide-react";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { VimeoEmbed } from "../components/VimeoEmbed";
import { CATEGORIES, getActiveCategories } from "../lib/contentStore";

const isVideoUrl = (url) =>
  /vimeo\.com|youtube\.com|youtu\.be/.test(String(url || ""));

export default function ProjectDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const content = useContent();
  const [lang] = useLang();
  const [showBts, setShowBts] = useState(false);
  const [muted, setMuted] = useState(true);
  const iframeRef = useRef(null);

  const projects = content.projects || [];
  const idx = projects.findIndex((p) => p.slug === slug);
  const project = idx >= 0 ? projects[idx] : null;

  const next = useMemo(() => {
    if (idx < 0 || projects.length === 0) return null;
    return projects[(idx + 1) % projects.length];
  }, [idx, projects.length]);

  if (!project) {
    return (
      <div className="pt-40 px-6 md:px-12 lg:px-16 min-h-[60vh] bg-white dark:bg-black" data-testid="project-not-found">
        <p className="text-neutral-500 dark:text-neutral-400 mb-6">{tr(T.project.notFound, lang)}</p>
        <Link to="/work" className="text-sm border-b border-black dark:border-white pb-1 text-black dark:text-white">
          {tr(T.project.back, lang)}
        </Link>
      </div>
    );
  }

  const heroVideoUrl =
    (isVideoUrl(project.preview_url) && project.preview_url) ||
    (isVideoUrl(project.cover) && project.cover) ||
    "";

  const isVimeo = /vimeo\.com/.test(heroVideoUrl);
  const isYoutube = /youtube\.com|youtu\.be/.test(heroVideoUrl);

  const toggleMuted = () => {
    const next = !muted;
    setMuted(next);
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    if (isVimeo) {
      iframe.contentWindow.postMessage(
        JSON.stringify({ method: "setMuted", value: next }),
        "*"
      );
      if (!next) {
        iframe.contentWindow.postMessage(
          JSON.stringify({ method: "setVolume", value: 1 }),
          "*"
        );
      }
    } else if (isYoutube) {
      iframe.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: next ? "mute" : "unMute",
          args: [],
        }),
        "*"
      );
    }
  };

  return (
    <div data-testid="project-detail-page" className="bg-white dark:bg-black transition-colors duration-500">

      {/* HERO VIDEO */}
      <section data-hero className="pt-24 md:pt-28">
        <div className="relative bg-black">
          {heroVideoUrl ? (
            <>
              <VimeoEmbed
                url={heroVideoUrl}
                autoplay
                muted
                className="aspect-video w-full"
                testId="project-hero-video"
                innerRef={iframeRef}
              />
              <button
                data-testid="project-mute-toggle"
                onClick={toggleMuted}
                aria-label={muted ? "Unmute" : "Mute"}
                className="absolute top-4 right-4 md:top-6 md:right-6 z-10 w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full bg-black/60 hover:bg-black text-white backdrop-blur transition"
              >
                {muted ? <VolumeX className="w-4 h-4 md:w-5 md:h-5" strokeWidth={1.5} /> : <Volume2 className="w-4 h-4 md:w-5 md:h-5" strokeWidth={1.5} />}
              </button>
            </>
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

      {/* CATEGORY NAV */}
      <section className="px-6 md:px-12 lg:px-16 pt-10 md:pt-14 border-b border-black/10 dark:border-white/10 pb-5">
        <div className="flex flex-wrap gap-x-8 gap-y-3" data-testid="project-category-nav">
          <Link
            to="/work"
            data-testid="project-cat-all"
            className="text-[11px] tracking-[0.28em] uppercase text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white border-b border-transparent pb-1"
          >
            {tr(T.work.all, lang)}
          </Link>
          {getActiveCategories(projects).map((c) => (
            <Link
              key={c.id}
              to={`/work/${c.id}`}
              data-testid={`project-cat-${c.id}`}
              className={`text-[11px] tracking-[0.28em] uppercase pb-1 transition-colors ${
                project.category === c.id
                  ? "text-black dark:text-white border-b border-black dark:border-white"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white border-b border-transparent"
              }`}
            >
              {c[lang]}
            </Link>
          ))}
        </div>
      </section>

      {/* META — 3 COLUMNAS EN DESKTOP */}
      <section className="px-6 md:px-12 lg:px-16 py-12 md:py-20">
        <button
          onClick={() => navigate(-1)}
          data-testid="project-back-btn"
          className="inline-flex items-center gap-2 text-[11px] tracking-[0.28em] uppercase text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white mb-10"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} /> {tr(T.project.back, lang)}
        </button>

        {/* DESKTOP */}
        <div className="hidden md:grid grid-cols-12 gap-10 md:gap-12 items-start">

          {/* POSTER — 30% */}
          <aside className="col-span-3">
            {project.poster && (
              <div className="bg-neutral-100 dark:bg-neutral-900 overflow-hidden rounded-lg">
                <img
                  src={project.poster}
                  alt={`${project.title} poster`}
                  data-testid="project-poster"
                  loading="lazy"
                  className="w-full h-auto object-cover"
                />
              </div>
            )}
          </aside>

          {/* TÍTULO + SINOPSIS + EXTERNAL LINK — 50% */}
          <div className="col-span-6">
            <p className="text-[11px] tracking-[0.32em] uppercase text-neutral-500 dark:text-neutral-400 mb-4">
              {tr(project.type, lang)} — {project.year}
            </p>

            <h1
              data-testid="project-title"
              className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[0.95] text-black dark:text-white"
            >
              {project.title}
            </h1>

            <p className="mt-8 md:mt-10 text-base md:text-lg leading-relaxed text-neutral-700 dark:text-neutral-300 max-w-prose whitespace-pre-line">
              {tr(project.synopsis, lang)}
            </p>

            {project.external_link && (
              <a
                href={project.external_link}
                target="_blank"
                rel="noreferrer"
                data-testid="project-external-link"
                className="mt-10 inline-flex items-center gap-2 border border-black dark:border-white px-6 py-3 text-[11px] tracking-[0.28em] uppercase text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
              >
                {tr(T.project.external, lang)} <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              </a>
            )}
          </div>

          {/* FICHA TÉCNICA — 20% */}
          <aside className="col-span-3 md:border-l md:border-black/10 dark:md:border-white/10 md:pl-10">
            <dl className="space-y-6 text-sm">
              {project.director && (
                <div>
                  <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 dark:text-neutral-500 mb-1">
                    {tr(T.project.director, lang)}
                  </dt>
                  <dd className="text-black dark:text-white">{project.director}</dd>
                </div>
              )}

              <div>
                <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 dark:text-neutral-500 mb-1">
                  {tr(T.project.year, lang)}
                </dt>
                <dd className="text-black dark:text-white">{project.year}</dd>
              </div>

              <div>
                <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 dark:text-neutral-500 mb-1">
                  {tr(T.project.type, lang)}
                </dt>
                <dd className="text-black dark:text-white">{tr(project.type, lang)}</dd>
              </div>

              <div>
                <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 dark:text-neutral-500 mb-1">
                  {tr(T.project.format, lang)}
                </dt>
                <dd className="text-black dark:text-white">{project.format}</dd>
              </div>
            </dl>
          </aside>
        </div>

        {/* MOBILE — layout original */}
        <div className="md:hidden">
          <p className="text-[11px] tracking-[0.32em] uppercase text-neutral-500 dark:text-neutral-400 mb-4">
            {tr(project.type, lang)} — {project.year}
          </p>
          <h1 className="text-4xl font-light tracking-tight text-black dark:text-white">
            {project.title}
          </h1>
          <p className="mt-6 text-base leading-relaxed text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
            {tr(project.synopsis, lang)}
          </p>

          {project.poster && (
            <div className="mt-10 bg-neutral-100 dark:bg-neutral-900 overflow-hidden rounded-lg">
              <img
                src={project.poster}
                alt={`${project.title} poster`}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          <dl className="mt-10 space-y-6 text-sm">
            {project.director && (
              <div>
                <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 dark:text-neutral-500 mb-1">
                  {tr(T.project.director, lang)}
                </dt>
                <dd className="text-black dark:text-white">{project.director}</dd>
              </div>
            )}

            <div>
              <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 dark:text-neutral-500 mb-1">
                {tr(T.project.year, lang)}
              </dt>
              <dd className="text-black dark:text-white">{project.year}</dd>
            </div>

            <div>
              <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 dark:text-neutral-500 mb-1">
                {tr(T.project.type, lang)}
              </dt>
              <dd className="text-black dark:text-white">{tr(project.type, lang)}</dd>
            </div>

            <div>
              <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 dark:text-neutral-500 mb-1">
                {tr(T.project.format, lang)}
              </dt>
              <dd className="text-black dark:text-white">{project.format}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* STILLS */}
      {project.stills && project.stills.length > 0 && (
        <section
          data-testid="project-stills"
          className="px-6 md:px-12 lg:px-16 pb-16 md:pb-24"
        >
          <p className="text-[11px] tracking-[0.32em] uppercase text-neutral-500 dark:text-neutral-400 mb-8">
            {tr(T.project.stills, lang)}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start">
            {project.stills.map((src, i) => (
              <div
                key={i}
                className="bg-neutral-100 dark:bg-neutral-900 overflow-hidden"
              >
                <img
                  src={src}
                  alt={`${project.title} still ${i + 1}`}
                  loading="lazy"
                  className="w-full h-auto object-contain block"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* BTS */}
      {project.bts && project.bts.length > 0 && (
        <section className="px-6 md:px-12 lg:px-16 pb-16 md:pb-24 border-t border-black/10 dark:border-white/10 pt-12">
          <button
            onClick={() => setShowBts((v) => !v)}
            data-testid="project-bts-toggle"
            className="flex items-center justify-between w-full"
          >
            <span className="text-[11px] tracking-[0.32em] uppercase text-neutral-500 dark:text-neutral-400">
              {tr(T.project.bts, lang)} · {project.bts.length}
            </span>
            <span className="text-[11px] tracking-[0.28em] uppercase border-b border-black dark:border-white pb-0.5 text-black dark:text-white">
              {showBts ? tr(T.project.hideBts, lang) : tr(T.project.showBts, lang)}
            </span>
          </button>
          {showBts && (
            <div
              data-testid="project-bts-grid"
              className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
            >
              {project.bts.map((src, i) => (
                <div key={i} className="bg-neutral-100 dark:bg-neutral-900 overflow-hidden aspect-[4/5]">
                  <img src={src} alt="BTS" loading="lazy" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* NEXT */}
      {next && (
        <section className="px-6 md:px-12 lg:px-16 py-16 md:py-24 border-t border-black/10 dark:border-white/10">
          <Link
            to={`/project/${next.slug}`}
            data-testid="project-next-link"
            className="group flex items-baseline justify-between gap-6"
          >
            <div>
              <p className="text-[11px] tracking-[0.32em] uppercase text-neutral-500 dark:text-neutral-400 mb-2">
                {tr(T.project.next, lang)}
              </p>
              <p className="text-2xl md:text-4xl tracking-tight font-light text-black dark:text-white group-hover:opacity-60 transition">
                {next.title}
              </p>
            </div>
            <ArrowRight className="w-6 h-6 md:w-8 md:h-8 text-black dark:text-white group-hover:translate-x-2 transition-transform" strokeWidth={1} />
          </Link>
        </section>
      )}
    </div>
  );
}
