import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, ArrowRight } from "lucide-react";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { VideoPlayer } from "../components/VideoPlayer";
import { getActiveCategories } from "../lib/contentStore";
import { ProjectCard } from "../components/ProjectCard";
import { ImageLightbox } from "../components/ImageLightbox";
import { useImageLightbox } from "../hooks/useImageLightbox";
import { optimizeCloudinaryUrl, IMG } from "../lib/cloudinary";

const oimg = (url, width = IMG.still, quality = "auto") =>
  url ? optimizeCloudinaryUrl(url, { width, quality }) : url;

const isVideoUrl = (url) =>
  /vimeo\.com|youtube\.com|youtu\.be/.test(String(url || ""));

/** Añade clase "revealed" al entrar en viewport */
function useReveal(deps = []) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    el.classList.remove("revealed");
    const raf = requestAnimationFrame(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.disconnect();
          }
        },
        { threshold: 0.06, rootMargin: "0px 0px -40px 0px" },
      );
      observer.observe(el);
    });
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

/** Stagger reveal sobre hijos .reveal-stagger */
function useRevealGrid(deps = []) {
  const ref = useRef(null);
  useEffect(() => {
    const container = ref.current;
    if (!container) return undefined;
    const items = Array.from(container.querySelectorAll(".reveal-stagger"));
    items.forEach((el) => el.classList.remove("revealed"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.04, rootMargin: "0px 0px -20px 0px" },
    );
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

export default function ProjectDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const content = useContent();
  const [lang] = useLang();
  const [heroMediaReady, setHeroMediaReady] = useState(false);

  const {
    open: lightboxOpen,
    closing: lightboxClosing,
    images: lightboxImages,
    index: lightboxIndex,
    setIndex: setLightboxIndex,
    label: lightboxLabel,
    title: lightboxTitle,
    openLightbox: openLb,
    closeLightbox,
  } = useImageLightbox();

  const projects = content.projects || [];
  const idx = projects.findIndex((p) => p.slug === slug);
  const project = idx >= 0 ? projects[idx] : null;

  const lightboxTypeLabels = useMemo(
    () => ({
      stills: tr(T.project.stills, lang),
      bts: lang === "es" ? "Detrás de cámara" : "Behind the scenes",
      poster: lang === "es" ? "Póster" : "Poster",
    }),
    [lang],
  );

  const openLightbox = useCallback(
    (images, index = 0, type = "stills") => {
      if (!images?.length) return;
      openLb({
        images,
        index,
        label: lightboxTypeLabels[type] || "",
        title: project?.title ?? "",
      });
    },
    [openLb, lightboxTypeLabels, project?.title],
  );

  const heroVideoUrl = project
    ? (isVideoUrl(project.preview_url) && project.preview_url) ||
      (isVideoUrl(project.cover) && project.cover) || ""
    : "";

  useEffect(() => { setHeroMediaReady(false); }, [slug]);

  useEffect(() => {
    if (!heroVideoUrl) return undefined;
    const t = window.setTimeout(() => setHeroMediaReady(true), 6000);
    return () => window.clearTimeout(t);
  }, [slug, heroVideoUrl]);

  const sameCatProjects = useMemo(() => {
    if (!project) return [];
    return projects.filter((p) => p.slug !== project.slug && p.category === project.category);
  }, [project, projects]);

  const otherCategories = useMemo(() => {
    if (!project) return [];
    return getActiveCategories(projects).filter((c) => c.id !== project.category);
  }, [project, projects]);

  // Refs
  const metaRef    = useReveal([slug]);
  const stillsRef  = useRevealGrid([slug]);
  const btsRef     = useRevealGrid([slug, project?.bts?.length ?? 0]);
  const sameCatRef = useRevealGrid([slug, sameCatProjects.length]);
  const exploreRef = useReveal([slug]);

  if (!project) {
    return (
      <div className="pt-40 px-6 md:px-12 lg:px-16 min-h-[60vh] bg-black" data-testid="project-not-found">
        <p className="text-neutral-500 mb-6">{tr(T.project.notFound, lang)}</p>
        <Link to="/work" className="text-sm border-b border-white pb-1 text-white">
          {tr(T.project.back, lang)}
        </Link>
      </div>
    );
  }

  const catLabel = getActiveCategories(projects).find((c) => c.id === project.category)?.[lang] || "";
  const hasStills = project.stills && project.stills.length > 0;
  const hasBts = project.bts && project.bts.length > 0;

  return (
    <div data-testid="project-detail-page" className="bg-black min-h-screen">

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section data-hero className="bg-black pt-16 md:pt-22 px-1.5 sm:px-4 md:px-8 lg:px-12">
        <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[1.75rem] md:rounded-[2.25rem] bg-neutral-950 shadow-[0_32px_80px_-20px_rgba(0,0,0,1)]">
          {heroVideoUrl ? (
            <>
              <div className={`w-full aspect-video transition-opacity duration-700 ${heroMediaReady ? "opacity-100" : "opacity-0"}`}>
                <VideoPlayer
                  url={heroVideoUrl}
                  playerKey={`hero-${slug}`}
                  autoplay loop interactive
                  className="aspect-video w-full h-full"
                  testId="project-hero-video"
                  onReady={() => window.setTimeout(() => setHeroMediaReady(true), 400)}
                />
              </div>
              {!heroMediaReady && (
                <div className="pointer-events-none absolute inset-0 z-10 bg-neutral-950">
                  {(project.cover && !isVideoUrl(project.cover)) || project.poster ? (
                    <img
                      src={oimg(project.cover && !isVideoUrl(project.cover) ? project.cover : project.poster, IMG.hero)}
                      alt="" className="w-full h-full object-cover opacity-60"
                    />
                  ) : null}
                </div>
              )}
            </>
          ) : project.cover && !isVideoUrl(project.cover) ? (
            <img src={oimg(project.cover, IMG.hero)} alt={project.title} data-testid="project-cover-image" className="w-full aspect-video object-cover" />
          ) : project.poster ? (
            <img src={oimg(project.poster, IMG.hero)} alt={project.title} data-testid="project-cover-image" className="w-full aspect-video object-cover" />
          ) : (
            <div className="w-full aspect-video bg-neutral-950" />
          )}

          {/* Botón volver flotante */}
          <button
            onClick={() => navigate(-1)}
            data-testid="project-back-btn"
            className="absolute left-3 top-3 z-20 md:left-5 md:top-5 inline-flex items-center gap-2 rounded-full bg-black/45 backdrop-blur-md px-3.5 py-2 text-[10px] tracking-[0.22em] uppercase text-white/80 hover:text-white hover:bg-black/65 transition border border-white/10"
          >
            <ArrowLeft className="w-3 h-3" strokeWidth={2} />
            <span className="hidden sm:inline">{tr(T.project.back, lang)}</span>
          </button>
        </div>
      </section>

      {/* ── META ──────────────────────────────────────────────── */}
      <section
        ref={metaRef}
        className="reveal px-4 sm:px-6 md:px-10 lg:px-14 pt-7 pb-10 md:pt-10 md:pb-14"
      >
        {/* Título */}
        <div className="mb-8 md:mb-10">
          <p className="text-[10px] tracking-[0.34em] uppercase text-neutral-500 mb-2.5">
            {catLabel && `${catLabel} · `}{tr(project.type, lang)} — {project.year}
          </p>
          <h1
            data-testid="project-title"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-none text-white max-w-4xl"
          >
            {project.title}
          </h1>
        </div>

        {/* Cuerpo: [poster desktop] | sinopsis+botones | ficha técnica */}
        <div
          className={`grid gap-6 md:gap-8 lg:gap-10 items-start ${
            project.poster
              ? "grid-cols-1 md:grid-cols-[190px_1fr_250px] lg:grid-cols-[230px_1fr_270px]"
              : "grid-cols-1 md:grid-cols-[1fr_250px] lg:grid-cols-[1fr_270px]"
          }`}
        >
          {/* Poster — columna propia solo en desktop */}
          {project.poster && (
            <button
              type="button"
              onClick={() => openLightbox([project.poster], 0, "poster")}
              data-testid="project-poster"
              className="hidden md:block group overflow-hidden rounded-xl ring-1 ring-white/10 hover:ring-white/30 transition-all duration-300 w-full self-start relative outline-none"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <img
                src={oimg(project.poster, IMG.poster)}
                alt="poster"
                loading="eager"
                className="w-full h-auto object-cover transition duration-500 group-hover:scale-[1.04] group-hover:brightness-90"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-400 flex flex-col items-center justify-center gap-1.5">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <ArrowUpRight className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                  </div>
                  <span className="text-[8px] tracking-[0.25em] uppercase text-white/70">
                    {lang === "es" ? "Ampliar" : "Expand"}
                  </span>
                </div>
              </div>
            </button>
          )}

          {/* Sinopsis + acciones */}
          <div className="min-w-0">
            {/* Poster flotante en móvil — el texto lo rodea */}
            {project.poster && (
              <button
                type="button"
                onClick={() => openLightbox([project.poster], 0, "poster")}
                className="md:hidden float-left mr-4 mb-3 w-[108px] group overflow-hidden rounded-xl ring-1 ring-white/10 hover:ring-white/30 transition-all duration-300 relative outline-none"
                style={{ WebkitTapHighlightColor: "transparent" }}
                aria-label={lang === "es" ? "Ampliar póster" : "Expand poster"}
              >
                <img
                  src={oimg(project.poster, IMG.poster)}
                  alt="poster"
                  loading="eager"
                  className="w-full h-auto object-cover transition duration-300 group-hover:brightness-90"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                  <ArrowUpRight className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
                </div>
              </button>
            )}

            <p className="text-[15px] md:text-base leading-relaxed text-neutral-400 whitespace-pre-line">
              {tr(project.synopsis, lang)}
            </p>

            {/* Botones pill con preview — stills y BTS */}
            {(hasStills || hasBts) && (
              <div className="mt-6 clear-left md:clear-none flex flex-wrap gap-2.5">
                {hasStills && (
                  <button
                    type="button"
                    onClick={() => openLightbox(project.stills, 0, "stills")}
                    className="group inline-flex items-center overflow-hidden rounded-full border border-white/15 hover:border-white/35 transition-all duration-300 outline-none focus:outline-none focus:ring-0"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                    aria-label={`Ver fotogramas (${project.stills.length})`}
                  >
                    <div className="h-7 w-11 overflow-hidden flex-shrink-0">
                      <img
                        src={oimg(project.stills[0], IMG.still)}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      />
                    </div>
                    <span className="px-3 text-[10px] tracking-[0.24em] uppercase text-white/65 group-hover:text-white transition-colors duration-200 whitespace-nowrap">
                      {lang === "es" ? "Fotogramas" : "Stills"} · {project.stills.length}
                    </span>
                  </button>
                )}

                {hasBts && (
                  <button
                    type="button"
                    onClick={() => openLightbox(project.bts, 0, "bts")}
                    className="group inline-flex items-center overflow-hidden rounded-full border border-white/15 hover:border-white/35 transition-all duration-300 outline-none focus:outline-none focus:ring-0"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                    aria-label={`Ver BTS (${project.bts.length})`}
                  >
                    <div className="h-7 w-11 overflow-hidden flex-shrink-0">
                      <img
                        src={oimg(project.bts[0], IMG.stillThumb)}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      />
                    </div>
                    <span className="px-3 text-[10px] tracking-[0.24em] uppercase text-white/65 group-hover:text-white transition-colors duration-200 whitespace-nowrap">
                      BTS · {project.bts.length}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Enlace externo */}
            {project.external_link && (
              <div className="mt-5">
                <a
                  href={project.external_link} target="_blank" rel="noreferrer"
                  data-testid="project-external-link"
                  className="rounded-full border border-white/15 px-4 py-1.5 text-[10px] tracking-[0.24em] uppercase text-white/70 hover:text-white hover:border-white/40 transition inline-flex items-center gap-1.5"
                >
                  {tr(T.project.external, lang)}
                  <ArrowUpRight className="w-3 h-3" strokeWidth={1.5} />
                </a>
              </div>
            )}
          </div>

          {/* Ficha técnica */}
          <div className="w-full">
            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4 md:p-5 space-y-4">
              {project.director && (
                <div>
                  <dt className="text-[9px] tracking-[0.3em] uppercase text-neutral-600 mb-0.5">{tr(T.project.director, lang)}</dt>
                  <dd className="text-[13px] text-neutral-200 leading-snug">{project.director}</dd>
                </div>
              )}
              {project.production_company && (
                <div>
                  <dt className="text-[9px] tracking-[0.3em] uppercase text-neutral-600 mb-0.5">{tr(T.project.productionCompany, lang)}</dt>
                  <dd className="text-[13px] text-neutral-200 leading-snug">{project.production_company}</dd>
                </div>
              )}
              <div className="flex gap-6">
                <div>
                  <dt className="text-[9px] tracking-[0.3em] uppercase text-neutral-600 mb-0.5">{tr(T.project.year, lang)}</dt>
                  <dd className="text-[13px] text-neutral-200">{project.year}</dd>
                </div>
                <div>
                  <dt className="text-[9px] tracking-[0.3em] uppercase text-neutral-600 mb-0.5">{tr(T.project.type, lang)}</dt>
                  <dd className="text-[13px] text-neutral-200">{tr(project.type, lang)}</dd>
                </div>
              </div>
              {project.format && (
                <div>
                  <dt className="text-[9px] tracking-[0.3em] uppercase text-neutral-600 mb-0.5">{tr(T.project.format, lang)}</dt>
                  <dd className="text-[13px] text-neutral-200 leading-snug">{project.format}</dd>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── GALERÍA DE STILLS ─────────────────────────────────── */}
      {hasStills && (
        <section className="px-1.5 sm:px-4 md:px-8 lg:px-12 pb-10 md:pb-14">
          {/* Cabecera */}
          <div className="flex items-center gap-4 mb-3 px-1">
            <p className="text-[10px] tracking-[0.34em] uppercase text-neutral-500 shrink-0">
              {lang === "es" ? "Fotogramas" : "Stills"} — {String(project.stills.length).padStart(2, "0")}
            </p>
            <div className="flex-1 h-px bg-white/6" />
            <button
              type="button"
              onClick={() => openLightbox(project.stills, 0, "stills")}
              className="shrink-0 text-[10px] tracking-[0.24em] uppercase text-neutral-600 hover:text-white/80 transition-colors duration-200"
            >
              {lang === "es" ? "Ver todos →" : "View all →"}
            </button>
          </div>

          <div ref={stillsRef} className="flex flex-col gap-1.5 sm:gap-2">
            {/* Fila principal: 1 grande + 2 apilados */}
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => openLightbox(project.stills, 0, "stills")}
                className="reveal-stagger group relative overflow-hidden rounded-2xl md:rounded-[1.75rem] bg-neutral-950 aspect-video cursor-zoom-in outline-none ring-1 ring-white/5 hover:ring-white/15 transition-all duration-500"
                style={{ "--delay": "0ms" }}
                aria-label={lang === "es" ? "Ver galería completa" : "View full gallery"}
              >
                <img
                  src={oimg(project.stills[0], IMG.stillGallery, "good")}
                  alt=""
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-[1.04] group-hover:brightness-[0.88]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-400 translate-y-1 group-hover:translate-y-0">
                  <span className="inline-flex items-center gap-2 text-[9px] tracking-[0.28em] uppercase text-white/80 bg-black/50 backdrop-blur-md rounded-full px-3.5 py-1.5 border border-white/10">
                    {lang === "es" ? "Ver galería" : "View gallery"} · {project.stills.length}
                  </span>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-[9px] tracking-[0.22em] text-white/40">01</span>
                </div>
              </button>

              {project.stills.length >= 2 && (
                <div className="grid grid-rows-2 gap-1.5 sm:gap-2">
                  {project.stills.slice(1, 3).map((src, i) => (
                      <button
                        key={src + i}
                        type="button"
                        onClick={() => openLightbox(project.stills, i + 1, "stills")}
                        className="reveal-stagger group relative overflow-hidden rounded-2xl bg-neutral-950 aspect-video sm:aspect-auto cursor-zoom-in outline-none ring-1 ring-white/5 hover:ring-white/15 transition-all duration-500"
                        style={{ "--delay": `${(i + 1) * 60}ms` }}
                        aria-label={`${lang === "es" ? "Fotograma" : "Still"} ${i + 2}`}
                      >
                        <img
                          src={oimg(src, IMG.stillGallery, "good")}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-[1.05] group-hover:brightness-[0.88]"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
                        <div className="absolute top-2 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="text-[9px] tracking-[0.22em] text-white/40">
                            {String(i + 2).padStart(2, "0")}
                          </span>
                        </div>
                      </button>
                  ))}
                </div>
              )}
            </div>

            {/* Segunda fila: hasta 4 fotogramas con +N en el último */}
            {project.stills.length > 3 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                {project.stills.slice(3, 7).map((src, i) => {
                  const isLastSlot = i === 3;
                  const remaining = project.stills.length - 7;
                  const showCount = isLastSlot && remaining > 0;
                  return (
                    <button
                      key={src + i}
                      type="button"
                      onClick={() => openLightbox(project.stills, showCount ? 0 : i + 3, "stills")}
                      className="reveal-stagger group relative overflow-hidden rounded-xl md:rounded-2xl bg-neutral-950 aspect-video cursor-zoom-in outline-none ring-1 ring-white/5 hover:ring-white/15 transition-all duration-500"
                      style={{ "--delay": `${(i + 3) * 55}ms` }}
                      aria-label={`${lang === "es" ? "Fotograma" : "Still"} ${i + 4}`}
                    >
                      <img
                        src={oimg(src, IMG.stillRow, "good")}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className={`w-full h-full object-cover transition-all duration-700 ${
                          showCount
                            ? "brightness-[0.35]"
                            : "group-hover:scale-[1.05] group-hover:brightness-[0.88]"
                        }`}
                      />
                      {showCount ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white text-2xl sm:text-3xl font-extralight tracking-tight">
                            +{remaining}
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
                          <div className="absolute top-2 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-[9px] tracking-[0.22em] text-white/40">
                              {String(i + 4).padStart(2, "0")}
                            </span>
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── BTS ───────────────────────────────────────────────── */}
      {hasBts && (
        <section className="px-1.5 sm:px-4 md:px-8 lg:px-12 pb-10 md:pb-14 border-t border-white/8 pt-8 sm:pt-10">
          <div className="flex items-center gap-4 mb-3 px-1">
            <p className="text-[10px] tracking-[0.34em] uppercase text-neutral-500 shrink-0">
              {lang === "es" ? "Detrás de cámara" : "Behind the scenes"} — {String(project.bts.length).padStart(2, "0")}
            </p>
            <div className="flex-1 h-px bg-white/6" />
            <button
              type="button"
              onClick={() => openLightbox(project.bts, 0, "bts")}
              className="shrink-0 text-[10px] tracking-[0.24em] uppercase text-neutral-600 hover:text-white/80 transition-colors duration-200"
            >
              {lang === "es" ? "Ver todos →" : "View all →"}
            </button>
          </div>

          <div
            ref={btsRef}
            className={`grid gap-1.5 sm:gap-2 ${
              project.bts.length === 1
                ? "grid-cols-1 max-w-md"
                : project.bts.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-2 sm:grid-cols-4"
            }`}
          >
            {project.bts.slice(0, 4).map((src, i) => {
              const isLastSlot = i === 3;
              const remaining = project.bts.length - 4;
              const showCount = isLastSlot && remaining > 0;
              return (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => openLightbox(project.bts, showCount ? 0 : i, "bts")}
                  className="reveal-stagger group relative overflow-hidden rounded-xl md:rounded-2xl bg-neutral-950 aspect-[4/3] cursor-zoom-in outline-none ring-1 ring-white/5 hover:ring-white/15 transition-all duration-500"
                  style={{ "--delay": `${i * 55}ms` }}
                  aria-label={`BTS ${i + 1}`}
                >
                  <img
                    src={oimg(src, IMG.stillGallery, "good")}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className={`w-full h-full object-cover transition-all duration-700 ${
                      showCount
                        ? "brightness-[0.35]"
                        : "group-hover:scale-[1.05] group-hover:brightness-[0.88]"
                    }`}
                  />
                  {showCount ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-2xl sm:text-3xl font-extralight tracking-tight">
                        +{remaining}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
                      <div className="absolute top-2 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-[9px] tracking-[0.22em] text-white/40">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── PROYECTOS DE LA MISMA CATEGORÍA ───────────────────── */}
      {sameCatProjects.length > 0 && (
        <section className="border-t border-white/8 px-1.5 sm:px-4 md:px-8 lg:px-12 pt-10 pb-14 md:pt-14 md:pb-20">
          <div className="px-3 sm:px-0 mb-8">
            <p className="text-[10px] tracking-[0.34em] uppercase text-neutral-600 mb-1">
              {lang === "es" ? "Más en" : "More in"}
            </p>
            <h2 className="text-xl sm:text-2xl font-light tracking-tight text-white">
              {catLabel}
            </h2>
          </div>

          <div
            ref={sameCatRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
          >
            {sameCatProjects.map((p, i) => (
              <div
                key={p.id}
                className="reveal-stagger"
                style={{ "--delay": `${i * 70}ms` }}
              >
                <ProjectCard project={p} lang={lang} eager={i < 4} index={i} aspectClass="aspect-video" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── EXPLORAR OTRAS CATEGORÍAS ─────────────────────────── */}
      {otherCategories.length > 0 && (
        <section
          ref={exploreRef}
          className="reveal border-t border-white/8 px-4 sm:px-6 md:px-10 lg:px-14 py-10 md:py-14"
        >
          <p className="text-[10px] tracking-[0.34em] uppercase text-neutral-600 mb-6">
            {lang === "es" ? "Explorar otras ramas" : "Explore other categories"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {otherCategories.map((c) => {
              const preview = projects.find((p) => p.category === c.id);
              const thumb = preview?.poster || preview?.cover;
              return (
                <Link
                  key={c.id}
                  to={`/work/${c.id}`}
                  className="group relative overflow-hidden rounded-2xl bg-neutral-950 ring-1 ring-white/10 hover:ring-white/25 transition-all duration-500 hover:scale-[1.02] p-5 flex flex-col justify-end min-h-[100px] sm:min-h-[120px]"
                >
                  {thumb && (
                    <img
                      src={oimg(thumb, IMG.card)} alt=""
                      className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-500 scale-[1.04] group-hover:scale-100"
                    />
                  )}
                  <div className="relative z-10">
                    <span className="text-lg sm:text-xl font-light tracking-tight text-white">
                      {c[lang]}
                    </span>
                  </div>
                  <ArrowRight className="absolute right-4 bottom-4 h-4 w-4 text-white/30 group-hover:text-white/70 group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <ImageLightbox
        open={lightboxOpen}
        closing={lightboxClosing}
        onClose={closeLightbox}
        images={lightboxImages}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        label={lightboxLabel}
        title={lightboxTitle}
        lang={lang}
      />
    </div>
  );
}
