import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { optimizeCloudinaryUrl, IMG } from "../lib/cloudinary";
import { ImageLightbox } from "../components/ImageLightbox";
import { useImageLightbox } from "../hooks/useImageLightbox";

/** Evita que el nombre del autor se parta en dos líneas (p. ej. Roger Deakins). */
function TaglineText({ text }) {
  const match = String(text).match(/^(.+\s[—–-]\s)(.+)$/);
  if (!match) return text;
  return (
    <>
      {match[1]}
      <span className="whitespace-nowrap">{match[2]}</span>
    </>
  );
}

export default function About() {
  const content = useContent();
  const [lang] = useLang();
  const {
    open: lightboxOpen,
    closing: lightboxClosing,
    images: lightboxImages,
    index: lightboxIndex,
    setIndex: setLightboxIndex,
    label: lightboxLabel,
    title: lightboxTitle,
    openLightbox,
    closeLightbox,
  } = useImageLightbox();

  const text = tr(content.about, lang);
  const paragraphs = String(text).split("\n").filter(Boolean);
  const photo = content.site.about_image
    ? optimizeCloudinaryUrl(content.site.about_image, { width: IMG.about })
    : null;
  const { name, title, tagline } = content.site;

  return (
    <>
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

      {/* ── Página ─────────────────────────────────────────────────────── */}
      <div
        data-testid="about-page"
        className="cinema-page pt-28 sm:pt-32 md:pt-40 pb-28 md:pb-36 transition-colors duration-500 min-h-screen"
      >
        <div className="px-6 md:px-12 lg:px-16">

          {/* Cabecera */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-8 border-b border-black/10 dark:border-white/10 mb-14">
            <div>
              <p className="text-[10px] tracking-[0.18em] uppercase text-[var(--cinema-muted)] mb-5">
                {tr(T.about.title, lang)}
              </p>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-[-0.045em] font-light leading-[0.9] text-[var(--cinema-fg)]">
                {name}
              </h1>
              <p className="mt-4 text-[10px] tracking-[0.16em] uppercase text-[var(--cinema-muted)]">
                {tr(title, lang)}
              </p>
            </div>
            {tagline && (
              <p className="hidden lg:block text-[13px] text-neutral-400 dark:text-neutral-500 italic max-w-[22rem] text-right leading-relaxed">
                "<TaglineText text={tr(tagline, lang)} />"
              </p>
            )}
          </div>

          {/* Grid principal */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 lg:gap-14 md:items-stretch">

            {/* ── Columna foto ────────────────────────────────────────── */}
            <div className="md:col-span-5 flex flex-col">
              {photo && (
                <>
                  <button
                    aria-label={lang === "es" ? "Ampliar foto" : "Expand photo"}
                    className="group relative flex-1 flex flex-col min-h-[min(88vw,560px)] md:min-h-0 text-left cursor-zoom-in"
                    onClick={() =>
                      openLightbox({
                        images: [content.site.about_image],
                        label: lang === "es" ? "Retrato" : "Portrait",
                        title: content.site.about_photo_caption || name,
                      })
                    }
                  >
                    <div className="relative flex-1 min-h-[360px] md:min-h-0 overflow-hidden rounded-[1rem] md:rounded-[1.25rem] bg-neutral-900 ring-1 ring-white/[0.06]">
                      <img
                        src={photo}
                        alt={name}
                        data-testid="about-photo"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/25">
                        <span className="bg-white/90 dark:bg-black/75 backdrop-blur-md text-black dark:text-white text-[10px] tracking-[0.26em] uppercase px-5 py-2 rounded-full shadow-lg">
                          {lang === "es" ? "Ampliar" : "Expand"}
                        </span>
                      </div>
                    </div>
                  </button>

                  <p className="mt-3 shrink-0 text-[10px] tracking-[0.22em] uppercase text-neutral-400 dark:text-neutral-500 text-center">
                    {content.site.about_photo_caption || `${name} · ${tr(title, lang)}`}
                  </p>
                </>
              )}
            </div>

            {/* ── Columna texto ───────────────────────────────────────── */}
            <div className="md:col-span-6 md:col-start-7">
              {/* Primer párrafo destacado */}
              {paragraphs.length > 0 && (
                <p className="text-xl md:text-2xl font-light leading-[1.55] text-black dark:text-white mb-8">
                    {paragraphs[0]}
                </p>
              )}

              {paragraphs.length > 1 && (
                <div className="space-y-5 text-[16px] md:text-[17px] leading-[1.78] text-neutral-600 dark:text-neutral-300">
                  {paragraphs.slice(1).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              )}

              {/* Tagline móvil */}
              {tagline && (
                <p className="lg:hidden mt-10 text-[13px] text-neutral-400 dark:text-neutral-500 italic leading-relaxed border-t border-black/10 dark:border-white/10 pt-8">
                  "<TaglineText text={tr(tagline, lang)} />"
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
