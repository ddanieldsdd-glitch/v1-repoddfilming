import { Link, useLocation } from "react-router-dom";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";

export const Footer = () => {
  const content = useContent();
  const [lang] = useLang();
  const location = useLocation();
  if (location.pathname.startsWith("/admin")) return null;

  const s = content.site.social;
  const year = new Date().getFullYear();

  return (
    <footer
      data-testid="site-footer"
      className="border-t border-black/10 mt-0 px-6 md:px-12 lg:px-16 py-16 md:py-20 bg-white"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16">
        <div className="md:col-span-7">
          <p className="text-[11px] tracking-[0.32em] uppercase text-neutral-500 mb-6">
            {tr(T.contact.title, lang)}
          </p>
          <a
            href={`mailto:${s.email}`}
            data-testid="footer-email"
            className="block text-3xl md:text-5xl lg:text-6xl tracking-tight text-black hover:opacity-60 transition-opacity break-words"
          >
            {s.email}
          </a>
        </div>
        <div className="md:col-span-5 flex flex-col gap-3 md:items-end">
          <p className="text-[11px] tracking-[0.32em] uppercase text-neutral-500 mb-4">
            {tr(T.contact.follow, lang)}
          </p>
          {s.instagram && (
            <a data-testid="footer-instagram" href={s.instagram} target="_blank" rel="noreferrer" className="text-sm tracking-wide hover:opacity-60">Instagram</a>
          )}
          {s.vimeo && (
            <a data-testid="footer-vimeo" href={s.vimeo} target="_blank" rel="noreferrer" className="text-sm tracking-wide hover:opacity-60">Vimeo</a>
          )}
          {s.linkedin && (
            <a data-testid="footer-linkedin" href={s.linkedin} target="_blank" rel="noreferrer" className="text-sm tracking-wide hover:opacity-60">LinkedIn</a>
          )}
          {s.imdb && (
            <a data-testid="footer-imdb" href={s.imdb} target="_blank" rel="noreferrer" className="text-sm tracking-wide hover:opacity-60">IMDb</a>
          )}
        </div>
      </div>
      <div className="mt-16 md:mt-24 pt-8 border-t border-black/10 flex flex-col md:flex-row justify-between gap-3 text-[11px] tracking-[0.24em] uppercase text-neutral-500">
        <span>© {year} {content.site.name}</span>
        <Link to="/admin" className="hover:text-black opacity-40 hover:opacity-100 transition" data-testid="footer-admin-link">
          ·
        </Link>
      </div>
    </footer>
  );
};
