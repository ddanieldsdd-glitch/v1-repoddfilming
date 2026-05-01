import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { VimeoEmbed } from "../components/VimeoEmbed";
import { ProjectCard } from "../components/ProjectCard";
import { CATEGORIES } from "../lib/contentStore";

export default function Home() {
  const content = useContent();
  const [lang] = useLang();

  const featured = (content.projects || []).slice(0, 6);

  return (
    <div data-testid="home-page" className="bg-white">
      {/* FULLSCREEN HERO — showreel covers the entire viewport; nav appears on scroll */}
      <section className="relative w-full h-screen bg-black overflow-hidden hero-fullscreen">
        <VimeoEmbed
          url={content.site.showreel_url}
          autoplay
          background
          muted
          className="absolute inset-0 w-full h-full"
          testId="hero-showreel"
        />
        {/* Subtle scroll hint */}
        <div className="absolute bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/70 text-[10px] tracking-[0.32em] uppercase pointer-events-none">
          <span>{tr(T.hero.scroll, lang)}</span>
          <ChevronDown className="w-4 h-4 animate-bounce" strokeWidth={1} />
        </div>
        {/* Hidden H1/title for SEO/accessibility/tests */}
        <h1 data-testid="hero-name" className="sr-only">
          {content.site.name}
        </h1>
        <p data-testid="hero-title" className="sr-only">
          {tr(content.site.title, lang)}
        </p>
      </section>

      {/* NAME BLOCK — below the hero, big editorial */}
      <section className="px-6 md:px-12 lg:px-16 py-20 md:py-28">
        <p className="text-[11px] tracking-[0.32em] uppercase text-neutral-500 mb-6">
          {tr(content.site.title, lang)}
        </p>
        <p className="text-6xl md:text-8xl lg:text-9xl font-light tracking-tight leading-[0.92]">
          {content.site.name}
        </p>
      </section>

      {/* SELECTED WORK — compact 2-column grid with hover-play */}
      <section
        data-testid="home-selected-section"
        className="px-6 md:px-12 lg:px-16 py-16 md:py-20 border-t border-black/10"
      >
        <div className="flex items-baseline justify-between mb-10 md:mb-14">
          <h2 className="text-2xl md:text-4xl tracking-tight font-light">
            {tr(T.work.title, lang)}
          </h2>
          <Link
            to="/work"
            data-testid="home-view-all"
            className="hidden md:inline-flex items-center gap-2 text-[11px] tracking-[0.28em] uppercase border-b border-black pb-1 hover:opacity-60 transition"
          >
            {tr(T.work.all, lang)} <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 md:gap-x-8 gap-y-10 md:gap-y-14">
          {featured.map((p, i) => (
            <ProjectCard key={p.id} project={p} lang={lang} eager={i < 2} />
          ))}
        </div>

        <div className="mt-10 md:hidden">
          <Link
            to="/work"
            data-testid="home-view-all-mobile"
            className="inline-flex items-center gap-2 text-[11px] tracking-[0.28em] uppercase border-b border-black pb-1"
          >
            {tr(T.work.all, lang)} <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
        </div>
      </section>

      {/* CATEGORIES STRIP — tight spacing */}
      <section className="px-6 md:px-12 lg:px-16 py-10 md:py-12 border-t border-black/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-6">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              to={`/work/${c.id}`}
              data-testid={`home-category-${c.id}`}
              className="group block"
            >
              <p className="text-lg md:text-xl tracking-tight text-black group-hover:opacity-50 transition">
                {c[lang]}
              </p>
              <span className="mt-2 inline-block w-6 h-px bg-black/30 group-hover:w-12 group-hover:bg-black transition-all duration-500" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
