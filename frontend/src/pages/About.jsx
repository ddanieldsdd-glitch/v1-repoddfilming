import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";

export default function About() {
  const content = useContent();
  const [lang] = useLang();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const text = tr(content.about, lang);
  const paragraphs = String(text).split("\n").filter(Boolean);
  const photo = content.site.about_image;
  const { name, title, tagline, social } = content.site;

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setLightboxOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  const socialLinks = [
    social?.email    && { href: `mailto:${social.email}`,    label: social.email,  external: false },
    social?.instagram && { href: social.instagram,            label: "Instagram",   external: true  },
    social?.vimeo     && { href: social.vimeo,                label: "Vimeo",       external: true  },
    social?.imdb      && { href: social.imdb,                 label: "IMDb",        external: true  },
  ].filter(Boolean);

  return (
    <>
      {/* ── Lightbox (portal → directo en body, evita stacking context) ── */}
      {lightboxOpen && photo && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] bg-black/96 flex items-center justify-center cursor-zoom-out"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            aria-label="Cerrar"
            className="absolute top-5 right-6 text-white/50 hover:text-white transition-colors text-4xl leading-none font-extralight"
            onClick={() => setLightboxOpen(false)}
          >
            ×
          </button>
          <img
            src={photo}
            alt={name}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body,
      )}

      {/* ── Página ─────────────────────────────────────────────────────── */}
      <div
        data-testid="about-page"
        className="bg-white dark:bg-black pt-28 sm:pt-32 md:pt-40 pb-28 transition-colors duration-500 min-h-screen"
      >
        <div className="px-6 md:px-12 lg:px-16">

          {/* Cabecera */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-8 border-b border-black/10 dark:border-white/10 mb-14">
            <div>
              <p className="text-[11px] tracking-[0.32em] uppercase text-neutral-500 dark:text-neutral-400 mb-5">
                {tr(T.about.title, lang)}
              </p>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight font-light leading-[0.9] text-black dark:text-white">
                {name}
              </h1>
              <p className="mt-4 text-[11px] tracking-[0.26em] uppercase text-neutral-500 dark:text-neutral-400">
                {tr(title, lang)}
              </p>
            </div>
            {tagline && (
              <p className="hidden lg:block text-[13px] text-neutral-400 dark:text-neutral-500 italic max-w-[22rem] text-right leading-relaxed">
                "{tr(tagline, lang)}"
              </p>
            )}
          </div>

          {/* Grid principal */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">

            {/* ── Columna foto ────────────────────────────────────────── */}
            <div className="md:col-span-4">
              {photo && (
                <div className="group relative">
                  <button
                    aria-label={lang === "es" ? "Ampliar foto" : "Expand photo"}
                    className="block w-full text-left cursor-zoom-in"
                    onClick={() => setLightboxOpen(true)}
                  >
                    <div className="overflow-hidden rounded-[1.75rem] md:rounded-[2.25rem] bg-neutral-100 dark:bg-neutral-900 aspect-[3/4] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] dark:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]">
                      <img
                        src={photo}
                        alt={name}
                        data-testid="about-photo"
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                      {/* Hint overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/25 rounded-[inherit]">
                        <span className="bg-white/90 dark:bg-black/75 backdrop-blur-md text-black dark:text-white text-[10px] tracking-[0.26em] uppercase px-5 py-2 rounded-full shadow-lg">
                          {lang === "es" ? "Ampliar" : "Expand"}
                        </span>
                      </div>
                    </div>
                  </button>

                  <p className="mt-3 text-[10px] tracking-[0.22em] uppercase text-neutral-400 dark:text-neutral-500 text-center">
                    {name} · {tr(title, lang)}
                  </p>
                </div>
              )}

              {/* Links sociales */}
              {socialLinks.length > 0 && (
                <div className="mt-10 space-y-2.5">
                  {socialLinks.map(({ href, label, external }) => (
                    <a
                      key={label}
                      href={href}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="flex items-center gap-3 text-[11px] tracking-[0.22em] uppercase text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors group/link"
                    >
                      <span className="w-4 h-px bg-current transition-all duration-300 group-hover/link:w-7 shrink-0" />
                      {label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* ── Columna texto ───────────────────────────────────────── */}
            <div className="md:col-span-7 md:col-start-6">
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
                  "{tr(tagline, lang)}"
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
