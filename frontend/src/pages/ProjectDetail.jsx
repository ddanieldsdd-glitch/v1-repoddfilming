import { useRef, useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, ArrowRight } from "lucide-react";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { VideoPlayer } from "../components/VideoPlayer";
import { TransitionOverlay } from "../components/TransitionOverlay";
import { getActiveCategories } from "../lib/contentStore";
import { pauseAll } from "../lib/videoStore";

const isVideoUrl = (url) =>
  /vimeo\.com|youtube\.com|youtu\.be/.test(String(url || ""));

export default function ProjectDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const content = useContent();
  const [lang] = useLang();
  const [heroMediaReady, setHeroMediaReady] = useState(false);
  const [inlineMediaReady, setInlineMediaReady] = useState({});
  const inlineRefs = useRef({});
  const inlineSectionRef = useRef(null);
  const activeInlineSlugRef = useRef("");
  const activeVideoTimerRef = useRef(null);
  const [activeInlineSlug, setActiveInlineSlug] = useState("");
  const [activeVideoSlug, setActiveVideoSlug] = useState("");

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

  const nextImage = () => {
    setLightboxIndex((i) => (i + 1) % lightboxImages.length);
  };

  const prevImage = () => {
    setLightboxIndex((i) => (i - 1 + lightboxImages.length) % lightboxImages.length);
  };

  const activateInlineProject = (nextSlug) => {
    if (nextSlug === activeInlineSlugRef.current) return;
    activeInlineSlugRef.current = nextSlug;
    if (activeVideoTimerRef.current) window.clearTimeout(activeVideoTimerRef.current);
    setActiveVideoSlug("");
    if (nextSlug) {
      setInlineMediaReady((ready) => ({ ...ready, [nextSlug]: false }));
    }
    // Pause all players via global store; the active inline will autoplay
    pauseAll();
    setActiveInlineSlug(nextSlug);
    if (nextSlug) {
      activeVideoTimerRef.current = window.setTimeout(() => {
        setActiveVideoSlug(nextSlug);
      }, 420);
    }
  };

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
    activeInlineSlugRef.current = "";
    setActiveVideoSlug("");
    setActiveInlineSlug("");
    if (activeVideoTimerRef.current) window.clearTimeout(activeVideoTimerRef.current);
  }, [slug]);

  useEffect(() => () => {
    if (activeVideoTimerRef.current) window.clearTimeout(activeVideoTimerRef.current);
  }, []);

  useEffect(() => {
    if (!heroVideoUrl) return undefined;
    const t = window.setTimeout(() => setHeroMediaReady(true), 6000);
    return () => window.clearTimeout(t);
  }, [slug, heroVideoUrl]);

  const sameCategoryProjects = useMemo(() => {
    if (!project) return [];
    const same = projects.filter((p) => p.category === project.category);
    const currentIndex = same.findIndex((p) => p.slug === project.slug);
    const ordered =
      currentIndex < 0
        ? same.filter((p) => p.slug !== project.slug)
        : [...same.slice(currentIndex + 1), ...same.slice(0, currentIndex)];
    return ordered.sort((a, b) => {
      const aHasVideo = isVideoUrl(a.preview_url) || isVideoUrl(a.cover);
      const bHasVideo = isVideoUrl(b.preview_url) || isVideoUrl(b.cover);
      if (aHasVideo === bHasVideo) return 0;
      return aHasVideo ? -1 : 1;
    });
  }, [project, projects]);

  const otherCategories = useMemo(() => {
    if (!project) return [];
    return getActiveCategories(projects).filter((c) => c.id !== project.category);
  }, [project, projects]);

  useEffect(() => {
    const handleScroll = () => {
      const top = inlineSectionRef.current?.getBoundingClientRect().top;
      if (typeof top === "number" && top > window.innerHeight * 0.65) {
        activateInlineProject("");
      } else if (typeof top === "number" && top <= window.innerHeight * 0.65) {
        if (!activeInlineSlug) activateInlineProject(sameCategoryProjects[0]?.slug || "");
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [slug, sameCategoryProjects, activeInlineSlug]);

  useEffect(() => {
    const nodes = Object.values(inlineRefs.current).filter(Boolean);
    if (nodes.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const slug = visible?.target?.dataset?.projectSlug;
        if (slug) activateInlineProject(slug);
      },
      {
        threshold: [0.2],
        rootMargin: "-10% 0px -10% 0px",
      }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [sameCategoryProjects]);

  // The videoStore handles pausing all non-active players automatically
  // via pauseAll() in activateInlineProject

  if (!project) {
    return (
      <div
        className="pt-40 px-6 md:px-12 lg:px-16 min-h-[60vh] bg-white dark:bg-black"
        data-testid="project-not-found"
      >
        <p className="text-neutral-500 dark:text-neutral-400 mb-6">
          {tr(T.project.notFound, lang)}
        </p>
        <Link
          to="/work"
          className="text-sm border-b border-black dark:border-white pb-1 text-black dark:text-white"
        >
          {tr(T.project.back, lang)}
        </Link>
      </div>
    );
  }

  return (
    <div
      data-testid="project-detail-page"
      className="bg-white dark:bg-black transition-colors duration-500"
    >
      {/* HERO: vídeo o imagen contenidos en viewport (sin recorte agresivo) */}
      <section data-hero className="bg-black pt-24 md:pt-28">
        <div className="relative flex min-h-[min(88svh,calc(100vw*9/16+6rem))] w-full items-center justify-center px-2 pb-4 md:min-h-[min(90svh,calc(100vw*9/16+7rem))] md:px-6 md:pb-6">
          {heroVideoUrl && !activeInlineSlug ? (
            <>
              <div className="relative z-[2] flex h-full w-full max-h-[calc(100svh-5.5rem)] md:max-h-[calc(100svh-6.5rem)] items-center justify-center">
                <div className="relative aspect-video w-full max-w-[min(100%,calc((100svh-6rem)*16/9))] overflow-hidden rounded-sm bg-black shadow-none md:max-w-[min(100%,calc((100svh-7rem)*16/9))]">
                  <div className={`absolute inset-0 transition-opacity duration-1000 ease-out ${heroMediaReady ? "opacity-100" : "opacity-0"}`}>
                    <VideoPlayer
                      url={heroVideoUrl}
                      playerKey={`hero-${slug}`}
                      autoplay
                      loop
                      className="aspect-video h-full w-full"
                      testId="project-hero-video"
                      interactive
                      onReady={() => {
                        window.setTimeout(() => setHeroMediaReady(true), 450);
                      }}
                    />
                  </div>
                  {!heroMediaReady && (
                    <div className="pointer-events-none absolute inset-0 z-[4] bg-black" />
                  )}
                </div>
              </div>
            </>
          ) : project.cover && !isVideoUrl(project.cover) ? (
            <div className="flex max-h-[calc(100svh-5.5rem)] w-full items-center justify-center py-4 md:max-h-[calc(100svh-6.5rem)]">
              <img
                src={project.cover}
                alt={project.title}
                data-testid="project-cover-image"
                className="max-h-[calc(100svh-6rem)] w-auto max-w-full object-contain"
              />
            </div>
          ) : project.poster ? (
            <div className="flex max-h-[calc(100svh-5.5rem)] w-full items-center justify-center py-4 md:max-h-[calc(100svh-6.5rem)]">
              <img
                src={project.poster}
                alt={project.title}
                data-testid="project-cover-image"
                className="max-h-[calc(100svh-6rem)] w-auto max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="h-[60svh] w-full bg-black" />
          )}
        </div>
      </section>

      {/* META */}
      <section className="px-6 md:px-12 lg:px-16 py-12 md:py-20">
        <button
          onClick={() => navigate(-1)}
          data-testid="project-back-btn"
          className="inline-flex items-center gap-2 text-[11px] tracking-[0.28em] uppercase text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white mb-10"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />{" "}
          {tr(T.project.back, lang)}
        </button>

        {/* DESKTOP: POSTER | TEXTO | FICHA */}
        <div className="hidden md:grid grid-cols-12 gap-10 md:gap-14 items-start">
          {/* POSTER — 30% */}
          <aside className="col-span-3 sticky top-28">
            {project.poster && (
              <div className="group bg-neutral-100 dark:bg-neutral-900 overflow-hidden border border-black/10 dark:border-white/10">
                <img
                  src={project.poster}
                  alt={`${project.title} poster`}
                  data-testid="project-poster"
                  loading="lazy"
                  className="w-full h-auto object-cover cursor-zoom-in transition duration-700 group-hover:scale-[1.015] group-hover:opacity-90"
                  onClick={() => openLightbox([project.poster], 0)}
                />
              </div>
            )}
            {project.poster && (
              <p className="mt-3 text-[10px] tracking-[0.28em] uppercase text-neutral-400 dark:text-neutral-600">
                Poster
              </p>
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

            <p className="mt-8 md:mt-10 text-base md:text-lg leading-relaxed text-neutral-700 dark:text-neutral-300 max-w-[38rem] whitespace-pre-line">
              {tr(project.synopsis, lang)}
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              {project.stills && project.stills.length > 0 && (
                <button
                  type="button"
                  onClick={() => openLightbox(project.stills, 0)}
                  className="border-b border-black dark:border-white pb-1 text-[11px] tracking-[0.28em] uppercase text-black dark:text-white hover:opacity-60 transition"
                >
                  {lang === "es" ? "Fotogramas" : "Stills"} · {project.stills.length}
                </button>
              )}
              {project.bts && project.bts.length > 0 && (
                <button
                  type="button"
                  onClick={() => openLightbox(project.bts, 0)}
                  className="border-b border-black dark:border-white pb-1 text-[11px] tracking-[0.28em] uppercase text-black dark:text-white hover:opacity-60 transition"
                >
                  BTS · {project.bts.length}
                </button>
              )}
            </div>

            {project.external_link && (
              <a
                href={project.external_link}
                target="_blank"
                rel="noreferrer"
                data-testid="project-external-link"
                className="mt-10 inline-flex items-center gap-2 border border-black dark:border-white px-6 py-3 text-[11px] tracking-[0.28em] uppercase text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
              >
                {tr(T.project.external, lang)}{" "}
                <ArrowUpRight
                  className="w-3.5 h-3.5"
                  strokeWidth={1.5}
                />
              </a>
            )}
          </div>

          {/* FICHA TÉCNICA — 20% */}
          <aside className="col-span-3 md:border-l md:border-black/10 dark:md:border-white/10 md:pl-10">
            <dl className="text-sm border-t border-black/10 dark:border-white/10">
              {project.director && (
                <div className="py-5 border-b border-black/10 dark:border-white/10">
                  <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 dark:text-neutral-500 mb-2">
                    {tr(T.project.director, lang)}
                  </dt>
                  <dd className="text-black dark:text-white leading-relaxed">
                    {project.director}
                  </dd>
                </div>
              )}

              {project.production_company && (
                <div className="py-5 border-b border-black/10 dark:border-white/10">
                  <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 dark:text-neutral-500 mb-2">
                    {tr(T.project.productionCompany, lang)}
                  </dt>
                  <dd className="text-black dark:text-white leading-relaxed">
                    {project.production_company}
                  </dd>
                </div>
              )}

              <div className="py-5 border-b border-black/10 dark:border-white/10">
                <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 dark:text-neutral-500 mb-2">
                  {tr(T.project.year, lang)}
                </dt>
                <dd className="text-black dark:text-white">
                  {project.year}
                </dd>
              </div>

              <div className="py-5 border-b border-black/10 dark:border-white/10">
                <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 dark:text-neutral-500 mb-2">
                  {tr(T.project.type, lang)}
                </dt>
                <dd className="text-black dark:text-white">
                  {tr(project.type, lang)}
                </dd>
              </div>

              <div className="py-5 border-b border-black/10 dark:border-white/10">
                <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 dark:text-neutral-500 mb-2">
                  {tr(T.project.format, lang)}
                </dt>
                <dd className="text-black dark:text-white leading-relaxed">
                  {project.format}
                </dd>
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

          <div className="mt-8 flex flex-wrap gap-4">
            {project.stills && project.stills.length > 0 && (
              <button
                type="button"
                onClick={() => openLightbox(project.stills, 0)}
                className="border-b border-black dark:border-white pb-1 text-[11px] tracking-[0.28em] uppercase text-black dark:text-white"
              >
                {lang === "es" ? "Fotogramas" : "Stills"} · {project.stills.length}
              </button>
            )}
            {project.bts && project.bts.length > 0 && (
              <button
                type="button"
                onClick={() => openLightbox(project.bts, 0)}
                className="border-b border-black dark:border-white pb-1 text-[11px] tracking-[0.28em] uppercase text-black dark:text-white"
              >
                BTS · {project.bts.length}
              </button>
            )}
          </div>

          {project.poster && (
            <div className="mt-10 bg-neutral-100 dark:bg-neutral-900 overflow-hidden border border-black/10 dark:border-white/10">
              <img
                src={project.poster}
                alt={`${project.title} poster`}
                className="w-full h-auto object-cover cursor-zoom-in"
                onClick={() => openLightbox([project.poster], 0)}
              />
            </div>
          )}

          <dl className="mt-10 space-y-6 text-sm">
            {project.director && (
              <div>
                <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 dark:text-neutral-500 mb-1">
                  {tr(T.project.director, lang)}
                </dt>
                <dd className="text-black dark:text-white">
                  {project.director}
                </dd>
              </div>
            )}

            {project.production_company && (
              <div>
                <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 dark:text-neutral-500 mb-1">
                  {tr(T.project.productionCompany, lang)}
                </dt>
                <dd className="text-black dark:text-white">
                  {project.production_company}
                </dd>
              </div>
            )}

            <div>
              <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 dark:text-neutral-500 mb-1">
                {tr(T.project.year, lang)}
              </dt>
              <dd className="text-black dark:text-white">
                {project.year}
              </dd>
            </div>

            <div>
              <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 dark:text-neutral-500 mb-1">
                {tr(T.project.type, lang)}
              </dt>
              <dd className="text-black dark:text-white">
                {tr(project.type, lang)}
              </dd>
            </div>

            <div>
              <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 dark:text-neutral-500 mb-1">
                {tr(T.project.format, lang)}
              </dt>
              <dd className="text-black dark:text-white">
                {project.format}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {sameCategoryProjects.length > 0 && (
        <section ref={inlineSectionRef} className="border-t border-black/10 dark:border-white/10 bg-neutral-100/70 py-8 dark:bg-neutral-950 md:py-12">
          {/* CATEGORY NAV — encabezando los siguientes proyectos */}
          <div className="px-6 md:px-12 lg:px-16 mb-10 md:mb-16">
            <p className="text-[10px] tracking-[0.32em] uppercase text-neutral-500 dark:text-neutral-400 mb-4">
              {lang === "es" ? "Siguientes proyectos" : "Next projects"}
            </p>
            <div
              className="flex flex-wrap gap-x-8 gap-y-3"
              data-testid="project-category-nav"
            >
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
          </div>
          <div className="space-y-10 md:space-y-16">
            {sameCategoryProjects.map((p, i) => {
              const mediaUrl =
                (isVideoUrl(p.preview_url) && p.preview_url) ||
                (isVideoUrl(p.cover) && p.cover) ||
                "";
              const hasVideo = Boolean(mediaUrl);
              const isActive = activeInlineSlug === p.slug;
              return (
                <article
                  key={p.id}
                  ref={(node) => {
                    if (node) inlineRefs.current[p.slug] = node;
                    else delete inlineRefs.current[p.slug];
                  }}
                  data-project-slug={p.slug}
                  className={`mx-3 overflow-hidden border bg-white shadow-[0_30px_90px_rgba(0,0,0,0.08)] transition-[opacity,transform,border-color,box-shadow] duration-700 ease-out will-change-transform dark:bg-black md:mx-6 lg:mx-10 ${
                    isActive || !hasVideo
                      ? "translate-y-0 scale-100 border-black/20 opacity-100 shadow-[0_36px_110px_rgba(0,0,0,0.11)] dark:border-white/25"
                      : "translate-y-3 scale-[0.992] border-black/5 opacity-65 dark:border-white/5"
                  }`}
                >
                  <div className="px-4 pt-3 md:px-6 md:pt-4">
                    <p className={`text-[10px] tracking-[0.32em] uppercase transition-colors duration-700 ${
                      isActive || !hasVideo
                        ? "text-neutral-700 dark:text-neutral-300"
                        : "text-neutral-400 dark:text-neutral-600"
                    }`}>
                      {String(i + 1).padStart(2, "0")} / {String(sameCategoryProjects.length).padStart(2, "0")}
                    </p>
                  </div>
                  <section className="bg-black pt-3 md:pt-4">
                    <div className="relative flex min-h-[min(60svh,calc(100vw*9/16+3rem))] w-full items-center justify-center px-2 pb-2 md:min-h-[min(65svh,calc(100vw*9/16+4rem))] md:px-6 md:pb-4">
                      {mediaUrl ? (
                        <div className="relative z-[2] flex h-full w-full max-h-[calc(100svh-5.5rem)] md:max-h-[calc(100svh-6.5rem)] items-center justify-center">
                          <div className={`relative aspect-video w-full max-w-[min(100%,calc((100svh-6rem)*16/9))] overflow-hidden rounded-sm bg-black shadow-none transition-[opacity,transform] duration-700 ease-out md:max-w-[min(100%,calc((100svh-7rem)*16/9))] ${
                            isActive
                              ? "scale-100 opacity-100"
                              : "scale-[0.985] opacity-70"
                          }`}>
                            {activeVideoSlug === p.slug ? (
                              <>
                                <VideoPlayer
                                  key={`${p.slug}-active`}
                                  url={mediaUrl}
                                  playerKey={`inline-${p.slug}`}
                                  autoplay
                                  loop
                                  interactive
                                  className={`aspect-video h-full w-full transition-all duration-1000 ease-out ${
                                    inlineMediaReady[p.slug] ? "opacity-100" : "opacity-0"
                                  }`}
                                  testId={`project-inline-video-${p.slug}`}
                                  onReady={() => {
                                    window.setTimeout(() => {
                                      setInlineMediaReady((ready) => ({ ...ready, [p.slug]: true }));
                                    }, 700);
                                  }}
                                />
                                <div className={`pointer-events-none absolute inset-0 z-[3] bg-black transition-all duration-1000 ease-out ${
                                  inlineMediaReady[p.slug] ? "scale-[1.015] opacity-0" : "scale-100 opacity-100"
                                }`}>
                                    {p.cover && !isVideoUrl(p.cover) ? (
                                      <img
                                        src={p.cover}
                                        alt={p.title}
                                        loading="lazy"
                                        className="h-full w-full object-cover opacity-90"
                                      />
                                    ) : p.poster ? (
                                      <img
                                        src={p.poster}
                                        alt={p.title}
                                        loading="lazy"
                                        className="h-full w-full object-cover opacity-90"
                                      />
                                    ) : null}
                                  </div>
                              </>
                            ) : (
                              <>
                                {p.cover && !isVideoUrl(p.cover) ? (
                                  <img
                                    src={p.cover}
                                    alt={p.title}
                                    loading="lazy"
                                    className="h-full w-full object-cover opacity-80"
                                  />
                                ) : p.poster ? (
                                  <img
                                    src={p.poster}
                                    alt={p.title}
                                    loading="lazy"
                                    className="h-full w-full object-cover opacity-80"
                                  />
                                ) : (
                                  <div className="h-full w-full bg-black" />
                                )}
                              </>
                            )}
                            {!isActive && hasVideo && (
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
                                <span className="border border-white/20 bg-black/30 px-4 py-2 text-[10px] tracking-[0.28em] uppercase text-white/60 backdrop-blur-sm">
                                  {lang === "es" ? "Desplázate para activar" : "Scroll to activate"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex max-h-[calc(100svh-5.5rem)] w-full items-center justify-center py-4 md:max-h-[calc(100svh-6.5rem)]">
                          <img
                            src={p.cover}
                            alt={p.title}
                            loading="lazy"
                            className="max-h-[calc(100svh-6rem)] w-auto max-w-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="px-6 md:px-12 lg:px-16 py-8 md:py-14">
                    <div className="hidden md:grid grid-cols-12 gap-10 md:gap-14 items-start">
                      <aside className="col-span-3 sticky top-28">
                        {p.poster && (
                          <div className="group bg-neutral-100 dark:bg-neutral-900 overflow-hidden border border-black/10 dark:border-white/10">
                            <img
                              src={p.poster}
                              alt={`${p.title} poster`}
                              loading="lazy"
                              className="w-full h-auto object-cover cursor-zoom-in transition duration-700 group-hover:scale-[1.015] group-hover:opacity-90"
                              onClick={() => openLightbox([p.poster], 0)}
                            />
                          </div>
                        )}
                        {p.poster && (
                          <p className="mt-3 text-[10px] tracking-[0.28em] uppercase text-neutral-400 dark:text-neutral-600">
                            Poster
                          </p>
                        )}
                      </aside>

                      <div className="col-span-6">
                        <p className="text-[11px] tracking-[0.32em] uppercase text-neutral-500 dark:text-neutral-400 mb-4">
                          {tr(p.type, lang)} — {p.year}
                        </p>
                        <h2 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[0.95] text-black dark:text-white">
                          {p.title}
                        </h2>
                        <p className="mt-8 md:mt-10 text-base md:text-lg leading-relaxed text-neutral-700 dark:text-neutral-300 max-w-[38rem] whitespace-pre-line">
                          {tr(p.synopsis, lang)}
                        </p>
                        <div className="mt-10 flex flex-wrap gap-4">
                          {p.stills && p.stills.length > 0 && (
                            <button
                              type="button"
                              onClick={() => openLightbox(p.stills, 0)}
                              className="border-b border-black dark:border-white pb-1 text-[11px] tracking-[0.28em] uppercase text-black dark:text-white hover:opacity-60 transition"
                            >
                              {lang === "es" ? "Fotogramas" : "Stills"} · {p.stills.length}
                            </button>
                          )}
                          {p.bts && p.bts.length > 0 && (
                            <button
                              type="button"
                              onClick={() => openLightbox(p.bts, 0)}
                              className="border-b border-black dark:border-white pb-1 text-[11px] tracking-[0.28em] uppercase text-black dark:text-white hover:opacity-60 transition"
                            >
                              BTS · {p.bts.length}
                            </button>
                          )}
                        </div>
                        {p.external_link && (
                          <a
                            href={p.external_link}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-10 inline-flex items-center gap-2 border border-black dark:border-white px-6 py-3 text-[11px] tracking-[0.28em] uppercase text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                          >
                            {tr(T.project.external, lang)}{" "}
                            <ArrowUpRight
                              className="w-3.5 h-3.5"
                              strokeWidth={1.5}
                            />
                          </a>
                        )}
                      </div>

                      <aside className="col-span-3 md:border-l md:border-black/10 dark:md:border-white/10 md:pl-10">
                        <dl className="text-sm border-t border-black/10 dark:border-white/10">
                          {p.director && (
                            <div className="py-5 border-b border-black/10 dark:border-white/10">
                              <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 dark:text-neutral-500 mb-2">
                                {tr(T.project.director, lang)}
                              </dt>
                              <dd className="text-black dark:text-white leading-relaxed">
                                {p.director}
                              </dd>
                            </div>
                          )}
                          {p.production_company && (
                            <div className="py-5 border-b border-black/10 dark:border-white/10">
                              <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 dark:text-neutral-500 mb-2">
                                {tr(T.project.productionCompany, lang)}
                              </dt>
                              <dd className="text-black dark:text-white leading-relaxed">
                                {p.production_company}
                              </dd>
                            </div>
                          )}
                          <div className="py-5 border-b border-black/10 dark:border-white/10">
                            <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 dark:text-neutral-500 mb-2">
                              {tr(T.project.year, lang)}
                            </dt>
                            <dd className="text-black dark:text-white">{p.year}</dd>
                          </div>
                          <div className="py-5 border-b border-black/10 dark:border-white/10">
                            <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 dark:text-neutral-500 mb-2">
                              {tr(T.project.type, lang)}
                            </dt>
                            <dd className="text-black dark:text-white">{tr(p.type, lang)}</dd>
                          </div>
                          <div className="py-5 border-b border-black/10 dark:border-white/10">
                            <dt className="text-[10px] tracking-[0.32em] uppercase text-neutral-400 dark:text-neutral-500 mb-2">
                              {tr(T.project.format, lang)}
                            </dt>
                            <dd className="text-black dark:text-white leading-relaxed">
                              {p.format}
                            </dd>
                          </div>
                        </dl>
                      </aside>
                    </div>

                    <div className="md:hidden">
                      <p className="text-[11px] tracking-[0.32em] uppercase text-neutral-500 dark:text-neutral-400 mb-4">
                        {tr(p.type, lang)} — {p.year}
                      </p>
                      <h2 className="text-4xl font-light tracking-tight text-black dark:text-white">
                        {p.title}
                      </h2>
                      <p className="mt-6 text-base leading-relaxed text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
                        {tr(p.synopsis, lang)}
                      </p>
                      <div className="mt-8 flex flex-wrap gap-4">
                        {p.stills && p.stills.length > 0 && (
                          <button
                            type="button"
                            onClick={() => openLightbox(p.stills, 0)}
                            className="border-b border-black dark:border-white pb-1 text-[11px] tracking-[0.28em] uppercase text-black dark:text-white"
                          >
                            {lang === "es" ? "Fotogramas" : "Stills"} · {p.stills.length}
                          </button>
                        )}
                        {p.bts && p.bts.length > 0 && (
                          <button
                            type="button"
                            onClick={() => openLightbox(p.bts, 0)}
                            className="border-b border-black dark:border-white pb-1 text-[11px] tracking-[0.28em] uppercase text-black dark:text-white"
                          >
                            BTS · {p.bts.length}
                          </button>
                        )}
                      </div>
                      {p.poster && (
                        <div className="mt-10 bg-neutral-100 dark:bg-neutral-900 overflow-hidden border border-black/10 dark:border-white/10">
                          <img
                            src={p.poster}
                            alt={`${p.title} poster`}
                            loading="lazy"
                            className="w-full h-auto object-cover cursor-zoom-in"
                            onClick={() => openLightbox([p.poster], 0)}
                          />
                        </div>
                      )}
                    </div>
                  </section>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {otherCategories.length > 0 && (
        <section className="px-6 md:px-12 lg:px-16 py-16 md:py-24 border-t border-black/10 dark:border-white/10">
          <p className="text-[11px] tracking-[0.32em] uppercase text-neutral-500 dark:text-neutral-400 mb-8">
            {lang === "es" ? "Explorar otras ramas" : "Explore other branches"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {otherCategories.map((c) => (
              <Link
                key={c.id}
                to={`/work/${c.id}`}
                className="group border-t border-black/10 dark:border-white/10 pt-5"
              >
                <span className="text-2xl md:text-3xl tracking-tight font-light text-black dark:text-white group-hover:opacity-60 transition">
                  {c[lang]}
                </span>
                <ArrowRight className="mt-4 h-5 w-5 text-black dark:text-white group-hover:translate-x-2 transition-transform" strokeWidth={1.2} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* LIGHTBOX OVERLAY */}
      {lightboxOpen && lightboxImages.length > 0 && (
        <div
          className={`fixed inset-0 bg-black/95 backdrop-blur-md z-[9999] flex cursor-zoom-out items-center justify-center px-4 py-20 transition-opacity duration-300 md:px-10 ${lightboxClosing ? "opacity-0" : "opacity-100"}`}
          onClick={closeLightbox}
        >
          <div className="absolute left-6 top-6 md:left-10 md:top-8 text-[10px] tracking-[0.32em] uppercase text-white/50">
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
              className={`max-w-full max-h-full cursor-default object-contain shadow-2xl transition duration-300 ease-out ${lightboxClosing ? "scale-[0.985] opacity-0" : "scale-100 opacity-100 animate-[ddpFadeUp_450ms_ease-out_both]"}`}
            />

          </div>

          {lightboxImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-3 md:left-8 top-1/2 -translate-y-1/2 h-16 w-10 md:h-24 md:w-14 flex items-center justify-center text-white/60 hover:text-white border border-white/10 hover:border-white/40 bg-black/20 backdrop-blur-sm transition"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-3 md:right-8 top-1/2 -translate-y-1/2 h-16 w-10 md:h-24 md:w-14 flex items-center justify-center text-white/60 hover:text-white border border-white/10 hover:border-white/40 bg-black/20 backdrop-blur-sm transition"
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
                  className={`h-10 w-16 shrink-0 overflow-hidden border transition md:h-12 md:w-20 ${
                    i === lightboxIndex
                      ? "border-white opacity-100"
                      : "border-white/10 opacity-45 hover:opacity-80 hover:border-white/40"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            className="absolute top-5 right-5 md:top-8 md:right-10 h-10 w-10 flex items-center justify-center border border-white/10 text-white/60 hover:text-white hover:border-white/40 transition"
            aria-label="Close lightbox"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
