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

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      // While we are still over the fullscreen home hero (only home page)
      const stillOverHero =
        location.pathname === "/" && y < window.innerHeight - 80;
      setOverHero(stillOverHero);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [location.pathname]);

  useEffect(() => setOpen(false), [location.pathname]);

  if (location.pathname.startsWith("/admin")) return null;

  // White nav over the dark hero, transitions to white-bg/dark-text once we leave it.
  const txt = overHero ? "text-white" : "text-black";
  const muted = overHero ? "text-white/70" : "text-neutral-500";
  const divider = overHero ? "border-white/30" : "border-black/15";
  const inactive = overHero
    ? "text-white/70 hover:text-white"
    : "text-neutral-500 hover:text-black";

  const linkClass = ({ isActive }) =>
    `text-[11px] tracking-[0.28em] uppercase transition-colors duration-500 ${
      isActive ? txt : inactive
    }`;

  return (
    <header
      data-testid="site-nav"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        overHero
          ? "bg-transparent border-b border-transparent"
          : "bg-white/90 backdrop-blur-xl border-b border-black/10"
      }`}
    >
      <div className="px-6 md:px-12 lg:px-16 py-5 md:py-6 flex items-center justify-between">
        <Link to="/" data-testid="nav-logo" className="flex flex-col leading-none">
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
          <div className={`flex items-center gap-2 ml-4 pl-6 border-l transition-colors duration-500 ${divider}`}>
            <button
              data-testid="lang-es"
              onClick={() => setLang("es")}
              className={`text-[11px] tracking-[0.2em] uppercase transition-colors duration-500 ${
                lang === "es" ? txt : inactive
              }`}
            >
              ES
            </button>
            <span className={overHero ? "text-white/40" : "text-neutral-300"}>/</span>
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
          <span className={`block w-5 h-px transition-all ${overHero ? "bg-white" : "bg-black"} ${open ? "translate-y-[6px] rotate-45" : ""}`} />
          <span className={`block w-5 h-px transition-all ${overHero ? "bg-white" : "bg-black"} ${open ? "opacity-0" : "opacity-100"}`} />
          <span className={`block w-5 h-px transition-all ${overHero ? "bg-white" : "bg-black"} ${open ? "-translate-y-[6px] -rotate-45" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-black/10" data-testid="nav-mobile-menu">
          <div className="px-6 py-8 flex flex-col gap-6">
            <NavLink to="/work" className="text-[11px] tracking-[0.28em] uppercase text-black">{tr(T.nav.work, lang)}</NavLink>
            <NavLink to="/about" className="text-[11px] tracking-[0.28em] uppercase text-black">{tr(T.nav.about, lang)}</NavLink>
            <NavLink to="/contact" className="text-[11px] tracking-[0.28em] uppercase text-black">{tr(T.nav.contact, lang)}</NavLink>
            <div className="flex items-center gap-3 pt-4 border-t border-black/10">
              <button onClick={() => setLang("es")} className={`text-[11px] tracking-[0.2em] uppercase ${lang === "es" ? "text-black" : "text-neutral-400"}`}>ES</button>
              <span className="text-neutral-300">/</span>
              <button onClick={() => setLang("en")} className={`text-[11px] tracking-[0.2em] uppercase ${lang === "en" ? "text-black" : "text-neutral-400"}`}>EN</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
