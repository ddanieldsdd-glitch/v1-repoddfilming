import { useLocation } from "react-router-dom";
import { useContent, useLang } from "../lib/useContent";
import { tr } from "../lib/i18n";

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
      className="cinema-page border-t border-white/10 mt-0 px-6 md:px-12 lg:px-16 py-12 md:py-16 transition-colors duration-500"
    >
      <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-12">
        <div className="md:col-span-7">
          <p className="text-xl tracking-[-0.02em] text-[var(--cinema-fg)] md:text-2xl">
            {content.site.name}
          </p>
          <p className="mt-1.5 text-[10px] tracking-[0.16em] uppercase text-[var(--cinema-muted)]">
            {tr(content.site.title, lang)}
          </p>
          {content.site.location && (
            <p className="mt-6 text-xs text-white/45">
              {tr(content.site.location, lang)}
            </p>
          )}
        </div>
        <div className="flex flex-col items-start gap-3 md:col-span-5 md:items-end">
          {s.instagram && (
            <a data-testid="footer-instagram" href={s.instagram} target="_blank" rel="noreferrer" className="text-xs text-[var(--cinema-fg)] hover:opacity-60">Instagram ↗</a>
          )}
          {s.vimeo && (
            <a data-testid="footer-vimeo" href={s.vimeo} target="_blank" rel="noreferrer" className="text-xs text-[var(--cinema-fg)] hover:opacity-60">Vimeo ↗</a>
          )}
          <a data-testid="footer-email" href={`mailto:${s.email}`} className="text-xs text-[var(--cinema-fg)] hover:opacity-60">Email ↗</a>
        </div>
      </div>
      <div className="mt-12 md:mt-16 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between gap-2 text-[9px] tracking-[0.14em] uppercase text-white/40">
        <span>© {year} {content.site.name}</span>
      </div>
    </footer>
  );
};
