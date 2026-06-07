import { useRef, useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, ArrowRight } from "lucide-react";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { VideoPlayer } from "../components/VideoPlayer";
import { TransitionOverlay } from "../components/TransitionOverlay";
import { getActiveCategories } from "../lib/contentStore";
import { pauseAll } from "../lib/videoStore";
import { ProjectCard } from "../components/ProjectCard";

const isVideoUrl = (url) =>
  /vimeo\.com|youtube\.com|youtu\.be/.test(String(url || ""));

export default function ProjectDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const content = useContent();
  const [lang] = useLang();
  const [heroMediaReady, setHeroMediaReady] = useState(false);

  // LIGHTBOX
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxClosing, setLightboxClosing] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const touchStartRef = useRef({ x: 0, y: 0 });

  const openLightbox = (images, index = 0) => {
    if (!images || images.length === 0) return;
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxClosing(false);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxClosing(true);
    window.setTimeout(() => {
      setLightboxOpen(false);
      setLightboxClosing(false);
    }, 240);
  };

  const nextImage = () => setLightboxIndex((i) => (i + 1) % lightboxImages.length);
  const prevImage = () => setLightboxIndex((i) => (i - 1 + lightboxImages.length) % lightboxImages.length);

  const handleLightboxTouchStart = (e) => {
    const touch = e.touches?.[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleLightboxTouchEnd = (e) => {
    if (lightboxImages.length <= 1) return;
    const touch = e.changedTouches?.[0];
    if (!touch) return;
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    if (dx < 0) nextImage();
    else prevImage();
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, lightboxImages.length]);

  const projects = content.projects || [];
  const idx = projects.findIndex((p) => p.slug === slug);
  const project = idx >= 0 ? projects[idx] : null;

  const heroVideoUrl = project
    ? (isVideoUrl(project.preview_url) && project.preview_url) ||
      (isVideoUrl(project.cover) && project.cover) ||
      ""
    : "";

  useEffect(() => {
    setHeroMediaReady(false);
  }, [slug]);

  useEffect(() => {
    if (!heroVideoUrl) return undefined;
    const t = window.setTimeout(() => setHeroMediaReady(true), 6000);
    return () => window.clearTimeout(t);
  }, [slug, heroVideoUrl]);

  const relatedProjects = useMemo(() => {
    if (!project) return [];
    return projects
      .filter((p) => p.slug !== project.slug)
      .slice(0, 6);
  }, [project, projects]);

  const otherCategories = useMemo(() => {
    if (!project) return [];
    return getActiveCategories(projects).filter((c) => c.id !== project.category);
  }, [project, projects]);

  if (!project) {
    return (
      <div
        className="pt-40 px-6 md:px-12 lg:px-16 min-h-[60vh] bg-black"
        data-testid="project-not-found"
      >
        <p className="text-neutral-500 mb-6">
          {tr(T.project.notFound, lang)}
        </p>
        <Link
          to="/work"
          className="text-sm border-b border-white pb-1 text-white"
        >
          {tr(T.project.back, lang)}
        </Link>
      </div>
    );
  }

  return (
    <div
      data-testid="project-detail-page"
      className="bg-black min-h-screen"
    >
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section data-hero className="bg-black pt-20 md:pt-24 px-3 sm:px-5 md:px-8 lg:px-12">
        <div className="relative overflow-hidden rounded-[1.75rem] md:rounded-[2.25rem] bg-neutral-950 shadow-[0_32px_80px_-20px_rgba(0,0,0,1)]"
          style={{ maxHeight: "68svh" }}
        >
          {heroVideoUrl ? (
            <div
              className={`w-full aspect-video transition-opacity duration-700 ${heroMediaReady ? "opacity-100" : "opacity-0"}`}
            >
              <VideoPlayer
                url={heroVideoUrl}
                playerKey={`hero-${slug}`}
                autoplay
                loop
                className="aspect-video w-full h-full"
                testId="project-hero-video"
                interactive
                onReady={() => {
                  window.setTimeout(() => setHeroMediaReady(true), 400);
                }}
              />
            </div>
          ) : project.cover && !isVideoUrl(project.cover) ? (
            <img
              src={project.cover}
              alt={project.title}
              data-testid="project-cover-image"
              className="w-full aspect-video object-cover"
            />
          ) : project.poster ? (
            <img
              src={project.poster}
              alt={project.title}
              data-testid="project-cover-image"
              className="w-full aspect-video object-cover"
            />
          ) : (
            <div className="w-full aspect-video bg-neutral-950" />
          )}

          {!heroMediaReady && heroVideoUrl && (
            <div className="pointer-events-none absolute inset-0 z-10 bg-neutral-950">
              {(project.cover && !isVideoUrl(project.cover)) || project.poster ? (
                <img
                  src={project.cover && !isVideoUrl(project.cover) ? project.cover : project.poster}
                  alt=""
                  className="w-full h-full object-cover opacity-60"
                />
              ) : null}
            </div>
          )}

          {/* Back button flotante */}
          <button
            onClick={() => navigate(-1)}
            data-testid="project-back-btn"
            className="absolute left-4 top-4 z-20 md:left-5 md:top-5 inline-flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-md px-4 py-2 text-[10px] tracking-[0.24em] uppercase text-white/80 hover:text-white hover:bg-black/60 transition border border-white/10"
          >
            <ArrowLeft className="w-3 h-3" strokeWidth={2} />
            {tr(T.project.back, lang)}
          </button>
        </div>
      </section>

      {/* ── META ──────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 md:px-10 lg:px-14 pt-8 pb-12 md:pt-10 md:pb-16">

        {/* Tipo + año — supratítulo */}
        <p className="text-[10px] tracking-[0.34em] uppercase text-neutral-500 mb-3">
          {tr(project.type, lang)} — {project.year}
        </p>

        {/* Título */}
        <h1
          data-testid="project-title"
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[0.95] text-white mb-6 md:mb-8"
        >
          {project.title}
        </h1>

        {/* Cuerpo: synopsis + ficha lateral + poster */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 lg:gap-16 items-start">

          {/* Sinopsis + acciones */}
          <div className="flex-1 min-w-0">
            <p className="text-sm md:text-base leading-relaxed text-neutral-400 max-w-[42rem] whitespace-pre-line">
              {tr(project.synopsis, lang)}
            </p>

            <div className="mt-8 flex flex-wrap gap-3 md:gap-4">
              {project.stills && project.stills.length > 0 && (
                <button
                  type="button"
                  onClick={() => openLightbox(project.stills, 0)}
                  className="rounded-full border border-white/15 px-5 py-2 text-[10px] tracking-[0.24em] uppercase text-white/70 hover:text-white hover:border-white/40 transition"
                >
                  {lang === "es" ? "Fotogramas" : "Stills"} · {project.stills.length}
                </button>
              )}
              {project.bts && project.bts.length > 0 && (
                <button
                  type="button"
                  onClick={() => openLightbox(project.bts, 0)}
                  className="rounded-full border border-white/15 px-5 py-2 text-[10px] tracking-[0.24em] uppercase text-white/70 hover:text-white hover:border-white/40 transition"
                >
                  BTS · {project.bts.length}
                </button>
              )}
              {project.external_link && (
                <a
                  href={project.external_link}
                  target="_blank"
                  rel="noreferrer"
                  data-testid="project-external-link"
                  className="rounded-full border border-white/15 px-5 py-2 text-[10px] tracking-[0.24em] uppercase text-white/70 hover:text-white hover:border-white/40 transition inline-flex items-center gap-2"
                >
                  {tr(T.project.external, lang)}
                  <ArrowUpRight className="w-3 h-3" strokeWidth={1.5} />
                </a>
              )}
            </div>
          </div>

          {/* Panel de ficha técnica — glass pill */}
          <div className="w-full md:w-auto md:min-w-[220px] shrink-0">
            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 px-5 py-4 space-y-4">
              {project.director && (
                <div>
                  <dt className="text-[9px] tracking-[0.3em] uppercase text-neutral-600 mb-1">{tr(T.project.director, lang)}</dt>
                  <dd className="text-sm text-neutral-200 leading-snug">{project.director}</dd>
                </div>
              )}
              {project.production_company && (
                <div>
                  <dt className="text-[9px] tracking-[0.3em] uppercase text-neutral-600 mb-1">{tr(T.project.productionCompany, lang)}</dt>
                  <dd className="text-sm text-neutral-200 leading-snug">{project.production_company}</dd>
                </div>
              )}
              <div>
                <dt className="text-[9px] tracking-[0.3em] uppercase text-neutral-600 mb-1">{tr(T.project.year, lang)}</dt>
                <dd className="text-sm text-neutral-200">{project.year}</dd>
              </div>
              <div>
                <dt className="text-[9px] tracking-[0.3em] uppercase text-neutral-600 mb-1">{tr(T.project.type, lang)}</dt>
                <dd className="text-sm text-neutral-200">{tr(project.type, lang)}</dd>
              </div>
              {project.format && (
                <div>
                  <dt className="text-[9px] tracking-[0.3em] uppercase text-neutral-600 mb-1">{tr(T.project.format, lang)}</dt>
                  <dd className="text-sm text-neutral-200 leading-snug">{project.format}</dd>
                </div>
              )}
            </div>

            {/* Poster — miniatura clicable */}
            {project.poster && (
              <button
                type="button"
                onClick={() => openLightbox([project.poster], 0)}
                className="group mt-3 block w-full overflow-hidden rounded-xl ring-1 ring-white/10 hover:ring-white/30 transition"
                data-testid="project-poster"
              >
                <img
                  src={project.poster}
                  alt={`${project.title} poster`}
                  loading="lazy"
                  className="w-full h-auto object-cover transition duration-500 group-hover:scale-[1.03] group-hover:opacity-85"
                />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── PROYECTOS RELACIONADOS ─────────────────────────────── */}
      {relatedProjects.length > 0 && (
        <section className="border-t border-white/8 px-4 sm:px-5 md:px-8 lg:px-12 pt-12 pb-16 md:pt-16 md:pb-24">
          <p className="text-[10px] tracking-[0.34em] uppercase text-neutral-600 mb-8 md:mb-10 px-0.5">
            {lang === "es" ? "Más proyectos" : "More projects"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {relatedProjects.map((p, i) => (
              <ProjectCard key={p.id} project={p} lang={lang} eager={i < 3} compact index={i} />
            ))}
          </div>
        </section>
      )}

      {otherCategories.length > 0 && (
        <section className="border-t border-white/8 px-4 sm:px-6 md:px-10 lg:px-14 py-12 md:py-16">
          <p className="text-[10px] tracking-[0.34em] uppercase text-neutral-600 mb-8">
            {lang === "es" ? "Explorar" : "Explore"}
          </p>
          <div className="flex flex-wrap gap-3">
            {otherCategories.map((c) => (
              <Link
                key={c.id}
                to={`/work/${c.id}`}
                className="group inline-flex items-center gap-2 rounded-full border border-white/12 px-5 py-2.5 text-sm text-neutral-400 hover:text-white hover:border-white/35 transition"
              >
                {c[lang]}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── LIGHTBOX ──────────────────────────────────────────── */}
      {lightboxOpen && lightboxImages.length > 0 && (
        <div
          className={`fixed inset-0 bg-black/96 backdrop-blur-md z-[9999] flex cursor-zoom-out items-center justify-center px-4 py-20 transition-opacity duration-300 md:px-10 ${lightboxClosing ? "opacity-0" : "opacity-100"}`}
          onClick={closeLightbox}
        >
          <div className="absolute left-6 top-6 md:left-10 md:top-8 text-[10px] tracking-[0.32em] uppercase text-white/40">
            {String(lightboxIndex + 1).padStart(2, "0")} / {String(lightboxImages.length).padStart(2, "0")}
          </div>
          <div
            className="relative flex h-full w-full touch-pan-y items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleLightboxTouchStart}
            onTouchEnd={handleLightboxTouchEnd}
          >
            <img
              key={lightboxImages[lightboxIndex]}
              src={lightboxImages[lightboxIndex]}
              alt="Fullscreen"
              className={`max-w-full max-h-full cursor-default object-contain shadow-2xl transition duration-300 ease-out rounded-lg ${lightboxClosing ? "scale-[0.985] opacity-0" : "scale-100 opacity-100 animate-[ddpFadeUp_450ms_ease-out_both]"}`}
            />
          </div>

          {lightboxImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-3 md:left-8 top-1/2 -translate-y-1/2 h-16 w-10 md:h-24 md:w-14 flex items-center justify-center text-white/60 hover:text-white border border-white/10 hover:border-white/40 bg-black/30 backdrop-blur-sm transition rounded-xl"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-3 md:right-8 top-1/2 -translate-y-1/2 h-16 w-10 md:h-24 md:w-14 flex items-center justify-center text-white/60 hover:text-white border border-white/10 hover:border-white/40 bg-black/30 backdrop-blur-sm transition rounded-xl"
                aria-label="Next image"
              >
                ›
              </button>
            </>
          )}

          {lightboxImages.length > 1 && (
            <div
              className="absolute bottom-5 left-1/2 flex max-w-[90vw] -translate-x-1/2 gap-2 overflow-x-auto px-2 py-1 md:bottom-7"
              onClick={(e) => e.stopPropagation()}
            >
              {lightboxImages.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  aria-label={`Open image ${i + 1}`}
                  className={`h-10 w-16 shrink-0 overflow-hidden rounded-lg border transition md:h-12 md:w-20 ${
                    i === lightboxIndex
                      ? "border-white opacity-100"
                      : "border-white/10 opacity-40 hover:opacity-75 hover:border-white/35"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="absolute top-5 right-5 md:top-8 md:right-10 h-10 w-10 flex items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/40 transition"
            aria-label="Close lightbox"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
