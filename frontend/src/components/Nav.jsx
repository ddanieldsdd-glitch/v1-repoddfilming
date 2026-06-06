import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";

export const Nav = () => {
  const content = useContent();
  const [lang, setLang] = useLang();
  const location = useLocation();

  const [overHero, setOverHero] = useState(true);
  const [open, setOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar viewport
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Detectar scroll sobre el hero
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const hasHero =
        location.pathname === "/" ||
        location.pathname.startsWith("/project/");
      setOverHero(hasHero && y < window.innerHeight - 80);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [location.pathname]);

  // Detectar fullscreen real del navegador
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
    };
  }, []);

  // Cerrar menú móvil al cambiar de página
  useEffect(() => setOpen(false), [location.pathname]);

  if (location.pathname.startsWith("/admin")) return null;

  // En móvil el nav NUNCA se oculta para que la hamburguesa sea usable
  // En desktop se oculta sobre el hero o en fullscreen
  const hideNav = !isMobile && (overHero || isFullscreen);

  // Siempre usamos texto blanco (dark mode permanente)
  const txt = "text-white";
  const muted = "text-white/70";
  const inactive = "text-white/70 hover:text-white";

  const linkClass = ({ isActive }) =>
    `text-[11px] tracking-[0.28em] uppercase transition-colors duration-500 ${
      isActive ? txt : inactive
    }`;

  const logoUrl = content.site.logo_white;

  return (
    <header
      data-testid="site-nav"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        hideNav
          ? "opacity-100 translate-y-0 bg-transparent border-transparent"
          : "opacity-100 translate-y-0 bg-black/85 backdrop-blur-xl border-b border-white/10"
      }`}
    >
      <div className="px-6 md:px-12 lg:px-16 py-5 md:py-6 flex items-center justify-between">
        <Link to="/" data-testid="nav-logo" className="flex items-center gap-3 leading-none">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="DD"
              className="h-9 w-auto md:h-11 lg:h-12 transition-all duration-500 invert"
            />
          )}
          <span className="hidden sm:flex flex-col">
            <span
              className={`font-medium text-[15px] md:text-base tracking-[0.04em] transition-colors duration-500 ${txt}`}
            >
              {content.site.name}
            </span>
            <span
              className={`text-[10px] md:text-[11px] tracking-[0.32em] uppercase mt-1 transition-colors duration-500 ${muted}`}
            >
              {tr(content.site.title, lang)}
            </span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          <NavLink to="/work" className={linkClass} data-testid="nav-work">
            {tr(T.nav.work, lang)}
          </NavLink>
          <NavLink to="/about" className={linkClass} data-testid="nav-about">
            {tr(T.nav.about, lang)}
          </NavLink>
          <NavLink to="/contact" className={linkClass} data-testid="nav-contact">
            {tr(T.nav.contact, lang)}
          </NavLink>

          <div className="flex items-center gap-2 ml-2 pl-6 border-l border-white/25 transition-colors duration-500">
            <button
              data-testid="lang-es"
              onClick={() => setLang("es")}
              className={`text-[11px] tracking-[0.2em] uppercase transition-colors duration-500 ${
                lang === "es" ? txt : inactive
              }`}
            >
              ES
            </button>
            <span className="text-white/40">/</span>
            <button
              data-testid="lang-en"
              onClick={() => setLang("en")}
              className={`text-[11px] tracking-[0.2em] uppercase transition-colors duration-500 ${
                lang === "en" ? txt : inactive
              }`}
            >
              EN
            </button>
          </div>
        </nav>

        <button
          data-testid="nav-mobile-toggle"
          className="md:hidden flex flex-col gap-[5px] p-2"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          <span className={`block w-5 h-px transition-all bg-white ${open ? "translate-y-[6px] rotate-45" : ""}`} />
          <span className={`block w-5 h-px transition-all bg-white ${open ? "opacity-0" : "opacity-100"}`} />
          <span className={`block w-5 h-px transition-all bg-white ${open ? "-translate-y-[6px] -rotate-45" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-black border-t border-white/10" data-testid="nav-mobile-menu">
          <div className="px-6 py-8 flex flex-col gap-6">
            <NavLink to="/work" className="text-[11px] tracking-[0.28em] uppercase text-white">{tr(T.nav.work, lang)}</NavLink>
            <NavLink to="/about" className="text-[11px] tracking-[0.28em] uppercase text-white">{tr(T.nav.about, lang)}</NavLink>
            <NavLink to="/contact" className="text-[11px] tracking-[0.28em] uppercase text-white">{tr(T.nav.contact, lang)}</NavLink>
            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button onClick={() => setLang("es")} className={`text-[11px] tracking-[0.2em] uppercase ${lang === "es" ? "text-white" : "text-neutral-400"}`}>ES</button>
              <span className="text-neutral-300">/</span>
              <button onClick={() => setLang("en")} className={`text-[11px] tracking-[0.2em] uppercase ${lang === "en" ? "text-white" : "text-neutral-400"}`}>EN</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};