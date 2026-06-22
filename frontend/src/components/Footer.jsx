import { useLocation } from "react-router-dom";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { formatPhoneDisplay, telHref } from "../lib/utils";

export const Footer = () => {
  const content = useContent();
  const [lang] = useLang();
  const location = useLocation();
  if (location.pathname.startsWith("/admin")) return null;
  if (location.pathname.startsWith("/contact")) return null;
  if (location.pathname === "/showreel") return null;

  const s = content.site.social;
  const year = new Date().getFullYear();

  return (
    <footer
      data-testid="site-footer"
      className="border-t border-black/10 dark:border-white/10 mt-0 px-6 md:px-12 lg:px-16 py-10 md:py-12 bg-white dark:bg-black transition-colors duration-500"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10">
        <div className="md:col-span-7">
          <p className="text-[10px] tracking-[0.32em] uppercase text-neutral-500 dark:text-neutral-400 mb-4">
            {tr(T.contact.title, lang)}
          </p>
          <div className="flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-10 sm:gap-y-6">
            <a
              href={`mailto:${s.email}`}
              data-testid="footer-email"
              className="block text-xl md:text-2xl lg:text-3xl tracking-tight text-black dark:text-white hover:opacity-60 transition-opacity break-words"
            >
              {s.email}
            </a>
            {s.phone && (
              <a
                href={telHref(s.phone)}
                data-testid="footer-phone"
                className="block text-sm md:text-base lg:text-lg tracking-tight text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-opacity whitespace-nowrap"
              >
                {formatPhoneDisplay(s.phone)}
              </a>
            )}
          </div>
        </div>
        <div className="md:col-span-5 flex flex-col gap-2 md:items-end">
          <p className="text-[10px] tracking-[0.32em] uppercase text-neutral-500 dark:text-neutral-400 mb-3">
            {tr(T.contact.follow, lang)}
          </p>
          {s.instagram && (
            <a data-testid="footer-instagram" href={s.instagram} target="_blank" rel="noreferrer" className="text-xs tracking-wide text-black dark:text-white hover:opacity-60">Instagram</a>
          )}
          {s.vimeo && (
            <a data-testid="footer-vimeo" href={s.vimeo} target="_blank" rel="noreferrer" className="text-xs tracking-wide text-black dark:text-white hover:opacity-60">Vimeo</a>
          )}
          {s.linkedin && (
            <a data-testid="footer-linkedin" href={s.linkedin} target="_blank" rel="noreferrer" className="text-xs tracking-wide text-black dark:text-white hover:opacity-60">LinkedIn</a>
          )}
          {s.imdb && (
            <a data-testid="footer-imdb" href={s.imdb} target="_blank" rel="noreferrer" className="text-xs tracking-wide text-black dark:text-white hover:opacity-60">IMDb</a>
          )}
        </div>
      </div>
      <div className="mt-8 md:mt-12 pt-6 border-t border-black/10 dark:border-white/10 flex flex-col md:flex-row justify-between gap-2 text-[10px] tracking-[0.24em] uppercase text-neutral-500 dark:text-neutral-400">
        <span>© {year} {content.site.name}</span>
      </div>
    </footer>
  );
};
