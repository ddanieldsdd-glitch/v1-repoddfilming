import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useContent, useLang } from "../lib/useContent";
import { useTheme } from "../lib/useTheme";
import { T, tr } from "../lib/i18n";

export const Nav = () => {
  const content = useContent();
  const [lang, setLang] = useLang();
  const [theme, toggleTheme] = useTheme();
  const location = useLocation();
  const [overHero, setOverHero] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
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

  // If in dark mode, nav always uses light text on dark bg (no hero variant needed, since everything is dark).
  const darkMode = theme === "dark";
  // "whiteText" means letters should be white (over hero or in dark mode over dark bg).
  const whiteText = overHero || darkMode;

  const txt = whiteText ? "text-white" : "text-black";
  const muted = whiteText ? "text-white/70" : "text-neutral-500";
  const divider = whiteText ? "border-white/25" : "border-black/15";
  const inactive = whiteText
    ? "text-white/70 hover:text-white"
    : "text-neutral-500 hover:text-black";

  const linkClass = ({ isActive }) =>
    `text-[11px] tracking-[0.28em] uppercase transition-colors duration-500 ${
      isActive ? txt : inactive
    }`;

  // Background bar state:
  // over hero (light mode) = transparent, else = white/black with blur
  let barBg;
  if (overHero) {
    barBg = "bg-transparent border-b border-transparent";
  } else if (darkMode) {
    barBg = "bg-black/85 backdrop-blur-xl border-b border-white/10";
  } else {
    barBg = "bg-white/90 backdrop-blur-xl border-b border-black/10";
  }

  const logoUrl = content.site.logo_white;
  // The provided logo file actually has BLACK letters on transparent bg, so we
  // need to invert it on dark backgrounds (hero / dark mode) to make it white.
  const logoInverted = whiteText;

  return (
    <header
      data-testid="site-nav"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${barBg}`}
    >
      <div className="px-6 md:px-12 lg:px-16 py-5 md:py-6 flex items-center justify-between">
        <Link to="/" data-testid="nav-logo" className="flex items-center gap-3 leading-none">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="DD"
              className={`h-7 md:h-8 w-auto transition-all duration-500 ${
                logoInverted ? "invert" : ""
              }`}
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
          <button
            data-testid="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme (Shift+D)"
            className={`p-1.5 transition-colors duration-500 ${inactive} hover:${txt}`}
          >
            {darkMode ? <Sun className="w-[14px] h-[14px]" strokeWidth={1.5} /> : <Moon className="w-[14px] h-[14px]" strokeWidth={1.5} />}
          </button>
          <div className={`flex items-center gap-2 ml-2 pl-6 border-l transition-colors duration-500 ${divider}`}>
            <button
              data-testid="lang-es"
              onClick={() => setLang("es")}
              className={`text-[11px] tracking-[0.2em] uppercase transition-colors duration-500 ${
                lang === "es" ? txt : inactive
              }`}
            >
              ES
            </button>
            <span className={whiteText ? "text-white/40" : "text-neutral-300"}>/</span>
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
          <span className={`block w-5 h-px transition-all ${whiteText ? "bg-white" : "bg-black"} ${open ? "translate-y-[6px] rotate-45" : ""}`} />
          <span className={`block w-5 h-px transition-all ${whiteText ? "bg-white" : "bg-black"} ${open ? "opacity-0" : "opacity-100"}`} />
          <span className={`block w-5 h-px transition-all ${whiteText ? "bg-white" : "bg-black"} ${open ? "-translate-y-[6px] -rotate-45" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white dark:bg-black border-t border-black/10 dark:border-white/10" data-testid="nav-mobile-menu">
          <div className="px-6 py-8 flex flex-col gap-6">
            <NavLink to="/work" className="text-[11px] tracking-[0.28em] uppercase text-black dark:text-white">{tr(T.nav.work, lang)}</NavLink>
            <NavLink to="/about" className="text-[11px] tracking-[0.28em] uppercase text-black dark:text-white">{tr(T.nav.about, lang)}</NavLink>
            <NavLink to="/contact" className="text-[11px] tracking-[0.28em] uppercase text-black dark:text-white">{tr(T.nav.contact, lang)}</NavLink>
            <button onClick={toggleTheme} className="text-[11px] tracking-[0.28em] uppercase text-black dark:text-white text-left" data-testid="theme-toggle-mobile">
              {darkMode ? "Light mode" : "Dark mode"}
            </button>
            <div className="flex items-center gap-3 pt-4 border-t border-black/10 dark:border-white/10">
              <button onClick={() => setLang("es")} className={`text-[11px] tracking-[0.2em] uppercase ${lang === "es" ? "text-black dark:text-white" : "text-neutral-400"}`}>ES</button>
              <span className="text-neutral-300">/</span>
              <button onClick={() => setLang("en")} className={`text-[11px] tracking-[0.2em] uppercase ${lang === "en" ? "text-black dark:text-white" : "text-neutral-400"}`}>EN</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
