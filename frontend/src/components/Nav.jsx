import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { SITE_NAV_LOGO, SITE_NAV_LOGO_SRCSET } from "../lib/siteAssets";

export const Nav = () => {
  const content = useContent();
  const [lang, setLang] = useLang();
  const location = useLocation();

  const [overHero, setOverHero] = useState(true);
  const [open, setOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const hasHero =
        location.pathname === "/" ||
        location.pathname === "/showreel" ||
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

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  if (location.pathname.startsWith("/admin")) return null;
  if (location.pathname === "/showreel") return null;

  // El nav es siempre visible. Transparente sobre el hero, glass al hacer scroll.
  const isTransparent = overHero && !open;
  const isHidden      = isFullscreen;

  const logoUrl = SITE_NAV_LOGO;

  const linkClass = ({ isActive }) =>
    `text-[12px] tracking-[0.22em] uppercase transition-all duration-300 px-3.5 py-2 rounded-full ${
      isActive
        ? "text-white bg-white/12"
        : "text-white/60 hover:text-white hover:bg-white/8"
    }`;

  return (
    <header
      data-testid="site-nav"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isHidden
          ? "opacity-0 pointer-events-none"
          : isTransparent
            ? "bg-transparent backdrop-blur-none"
            : "bg-black/60 backdrop-blur-3xl"
      }`}
    >
      <div className="px-4 sm:px-6 md:px-10 lg:px-14 py-4 md:py-5 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" data-testid="nav-logo" className="flex items-center gap-2.5 leading-none shrink-0">
          {logoUrl && (
            <img
              src={logoUrl}
              srcSet={SITE_NAV_LOGO_SRCSET}
              alt="DD"
              width={88}
              height={44}
              decoding="async"
              className="h-8 w-auto md:h-11 transition-all duration-500 invert"
            />
          )}
          <span className="flex flex-col">
            <span className="font-medium text-sm md:text-[15px] tracking-[0.04em] text-white">
              {content.site.name}
            </span>
            <span className="text-[9px] md:text-[10px] tracking-[0.32em] uppercase mt-0.5 text-white/55">
              {tr(content.site.title, lang)}
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/work" className={linkClass} data-testid="nav-work">
            {tr(T.nav.work, lang)}
          </NavLink>
          <NavLink to="/about" className={linkClass} data-testid="nav-about">
            {tr(T.nav.about, lang)}
          </NavLink>
          <NavLink to="/contact" className={linkClass} data-testid="nav-contact">
            {tr(T.nav.contact, lang)}
          </NavLink>

          {/* Idioma — pill compacta */}
          <div className="ml-3 flex items-center gap-0.5 rounded-full bg-white/8 border border-white/10 p-1">
            <button
              data-testid="lang-es"
              onClick={() => setLang("es")}
              className={`px-2.5 py-1 rounded-full text-[10px] tracking-[0.18em] uppercase transition-all duration-300 ${
                lang === "es" ? "bg-white/15 text-white" : "text-white/50 hover:text-white"
              }`}
            >
              ES
            </button>
            <button
              data-testid="lang-en"
              onClick={() => setLang("en")}
              className={`px-2.5 py-1 rounded-full text-[10px] tracking-[0.18em] uppercase transition-all duration-300 ${
                lang === "en" ? "bg-white/15 text-white" : "text-white/50 hover:text-white"
              }`}
            >
              EN
            </button>
          </div>
        </nav>

        {/* Hamburguesa móvil */}
        <button
          data-testid="nav-mobile-toggle"
          className="md:hidden flex flex-col gap-[5px] p-2 rounded-full hover:bg-white/8 transition"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          <span className={`block w-5 h-px transition-all bg-white ${open ? "translate-y-[6px] rotate-45" : ""}`} />
          <span className={`block w-5 h-px transition-all bg-white ${open ? "opacity-0" : "opacity-100"}`} />
          <span className={`block w-5 h-px transition-all bg-white ${open ? "-translate-y-[6px] -rotate-45" : ""}`} />
        </button>
      </div>

      {/* Menú móvil — glass panel */}
      {open && (
        <div
          className="md:hidden mx-2 mb-2 rounded-2xl bg-black/70 backdrop-blur-2xl border border-white/10 overflow-hidden"
          data-testid="nav-mobile-menu"
        >
          <div className="px-5 py-6 flex flex-col gap-1">
            <NavLink
              to="/work"
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-xl text-[12px] tracking-[0.24em] uppercase transition-all ${
                  isActive ? "text-white bg-white/10" : "text-white/65 hover:text-white hover:bg-white/8"
                }`
              }
            >
              {tr(T.nav.work, lang)}
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-xl text-[12px] tracking-[0.24em] uppercase transition-all ${
                  isActive ? "text-white bg-white/10" : "text-white/65 hover:text-white hover:bg-white/8"
                }`
              }
            >
              {tr(T.nav.about, lang)}
            </NavLink>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-xl text-[12px] tracking-[0.24em] uppercase transition-all ${
                  isActive ? "text-white bg-white/10" : "text-white/65 hover:text-white hover:bg-white/8"
                }`
              }
            >
              {tr(T.nav.contact, lang)}
            </NavLink>

            <div className="mt-3 pt-4 border-t border-white/8 flex items-center gap-2">
              <button
                onClick={() => setLang("es")}
                className={`flex-1 py-2 rounded-xl text-[11px] tracking-[0.2em] uppercase transition-all ${
                  lang === "es" ? "bg-white/12 text-white" : "text-white/45 hover:bg-white/6 hover:text-white"
                }`}
              >
                ES
              </button>
              <button
                onClick={() => setLang("en")}
                className={`flex-1 py-2 rounded-xl text-[11px] tracking-[0.2em] uppercase transition-all ${
                  lang === "en" ? "bg-white/12 text-white" : "text-white/45 hover:bg-white/6 hover:text-white"
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
