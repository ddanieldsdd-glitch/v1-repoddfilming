import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { VideoPlayer } from "../components/VideoPlayer";
import { getActiveCategories } from "../lib/contentStore";
import { ProjectCard } from "../components/ProjectCard";

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

  // LIGHTBOX
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxClosing, setLightboxClosing] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxType, setLightboxType] = useState("stills");
  const [imgKey, setImgKey] = useState(0);
  const touchStartRef = useRef({ x: 0, y: 0 });

  const openLightbox = useCallback((images, index = 0, type = "stills") => {
    if (!images || images.length === 0) return;
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxType(type);
    setImgKey((k) => k + 1);
    setLightboxClosing(false);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxClosing(true);
    window.setTimeout(() => { setLightboxOpen(false); setLightboxClosing(false); }, 260);
  }, []);

  const nextImage = useCallback(() => {
    setImgKey((k) => k + 1);
    setLightboxIndex((i) => (i + 1) % lightboxImages.length);
  }, [lightboxImages.length]);

  const prevImage = useCallback(() => {
    setImgKey((k) => k + 1);
    setLightboxIndex((i) => (i - 1 + lightboxImages.length) % lightboxImages.length);
  }, [lightboxImages.length]);

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
    if (dx < 0) nextImage(); else prevImage();
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
  }, [lightboxOpen, closeLightbox, nextImage, prevImage]);

  // Bloquear scroll del body cuando el lightbox está abierto
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [lightboxOpen]);

  const projects = content.projects || [];
  const idx = projects.findIndex((p) => p.slug === slug);
  const project = idx >= 0 ? projects[idx] : null;

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
  const metaRef = useReveal([slug]);
  const sameCatRef = useRevealGrid([slug, sameCatProjects.length]);
  const exploreRef = useReveal([slug]);

  // Label para el lightbox según tipo
  const lightboxTypeLabel = useMemo(() => ({
    stills: tr(T.project.stills, lang),
    bts: lang === "es" ? "Detrás de cámara" : "Behind the scenes",
    poster: lang === "es" ? "Póster" : "Poster",
  }[lightboxType] || ""), [lightboxType, lang]);

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
                      src={project.cover && !isVideoUrl(project.cover) ? project.cover : project.poster}
                      alt="" className="w-full h-full object-cover opacity-60"
                    />
                  ) : null}
                </div>
              )}
            </>
          ) : project.cover && !isVideoUrl(project.cover) ? (
            <img src={project.cover} alt={project.title} data-testid="project-cover-image" className="w-full aspect-video object-cover" />
          ) : project.poster ? (
            <img src={project.poster} alt={project.title} data-testid="project-cover-image" className="w-full aspect-video object-cover" />
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
                src={project.poster}
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
                  src={project.poster}
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
                        src={project.stills[0]}
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
                        src={project.bts[0]}
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
                      src={thumb} alt=""
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

      {/* ── LIGHTBOX ──────────────────────────────────────────── */}
      {lightboxOpen && lightboxImages.length > 0 && (
        <div
          className={`fixed inset-0 z-[9999] bg-black transition-opacity duration-300 ${lightboxClosing ? "opacity-0" : "opacity-100"}`}
          onClick={closeLightbox}
        >
          {/* Barra superior */}
          <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
            <div className="flex items-start justify-between px-5 pt-5 pb-16 md:px-10 md:pt-7 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
              {/* Título + tipo */}
              <div className="pointer-events-auto">
                <p className="text-[9px] tracking-[0.35em] uppercase text-white/35 mb-1.5">
                  {lightboxTypeLabel}
                </p>
                <p className="text-sm sm:text-base font-light text-white/80 tracking-tight">
                  {project.title}
                </p>
              </div>

              {/* Contador + cerrar */}
              <div className="pointer-events-auto flex items-center gap-3">
                {lightboxImages.length > 1 && (
                  <span className="text-[11px] tracking-[0.25em] text-white/40 tabular-nums">
                    {String(lightboxIndex + 1).padStart(2, "0")}&thinsp;/&thinsp;{String(lightboxImages.length).padStart(2, "0")}
                  </span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
                  className="h-9 w-9 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/60 hover:text-white hover:bg-white/20 hover:border-white/25 transition-all duration-200"
                  aria-label="Cerrar"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Área principal de imagen — ocupa todo el ancho en móvil */}
          <div
            className="relative flex h-full w-full touch-pan-y items-center justify-center px-0 md:px-16"
            style={{
              paddingTop: "64px",
              paddingBottom: lightboxImages.length > 1 ? "76px" : "32px",
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleLightboxTouchStart}
            onTouchEnd={handleLightboxTouchEnd}
          >
            <img
              key={imgKey}
              src={lightboxImages[lightboxIndex]}
              alt={`${lightboxTypeLabel} ${lightboxIndex + 1}`}
              className={`w-full md:max-w-full max-h-full object-contain md:rounded-lg shadow-[0_32px_100px_-20px_rgba(0,0,0,0.9)] cursor-default transition-opacity duration-200 ${
                lightboxClosing
                  ? "opacity-0 scale-[0.97]"
                  : "opacity-100 scale-100 animate-[ddpFadeUp_320ms_ease-out_both]"
              }`}
              style={{ transition: lightboxClosing ? "opacity 0.26s ease, transform 0.26s ease" : undefined }}
            />
          </div>

          {/* Flechas de navegación — semitransparentes sobre la imagen en móvil */}
          {lightboxImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-1 md:left-5 top-1/2 -translate-y-1/2 z-20 h-12 w-9 md:h-14 md:w-14 flex items-center justify-center md:rounded-full bg-black/20 md:bg-white/8 backdrop-blur-sm md:border md:border-white/10 text-white/50 hover:text-white hover:bg-black/40 md:hover:bg-white/18 md:hover:border-white/30 transition-all duration-200"
                aria-label={lang === "es" ? "Anterior" : "Previous"}
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-1 md:right-5 top-1/2 -translate-y-1/2 z-20 h-12 w-9 md:h-14 md:w-14 flex items-center justify-center md:rounded-full bg-black/20 md:bg-white/8 backdrop-blur-sm md:border md:border-white/10 text-white/50 hover:text-white hover:bg-black/40 md:hover:bg-white/18 md:hover:border-white/30 transition-all duration-200"
                aria-label={lang === "es" ? "Siguiente" : "Next"}
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
              </button>
            </>
          )}

          {/* Tira de miniaturas inferior */}
          {lightboxImages.length > 1 && (
            <div
              className="absolute bottom-0 left-0 right-0 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pt-6 pb-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                <div
                  className="flex justify-center gap-1.5 overflow-x-auto px-4"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {lightboxImages.map((src, i) => (
                    <button
                      key={src + i}
                      type="button"
                      onClick={() => { setImgKey((k) => k + 1); setLightboxIndex(i); }}
                      aria-label={`Imagen ${i + 1}`}
                      className={`flex-none overflow-hidden rounded-md transition-all duration-200 ${
                        i === lightboxIndex
                          ? "ring-2 ring-white/80 opacity-100 scale-[1.10]"
                          : "ring-1 ring-white/10 opacity-35 hover:opacity-65 hover:ring-white/30 hover:scale-[1.05]"
                      }`}
                      style={{ width: "52px", height: "36px" }}
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
