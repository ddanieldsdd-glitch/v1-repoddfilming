import { Link } from "react-router-dom";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { VimeoEmbed } from "../components/VimeoEmbed";
import { ProjectCard } from "../components/ProjectCard";
import { CATEGORIES } from "../lib/contentStore";

export default function Home() {
  const content = useContent();
  const [lang] = useLang();

  const featured = (content.projects || []).slice(0, 4);

  return (
    <div data-testid="home-page" className="bg-white">
      {/* HERO */}
      <section className="relative min-h-screen flex flex-col">
        <div className="relative flex-1 flex flex-col">
          <div className="absolute inset-0 -z-0 bg-black">
            <VimeoEmbed
              url={content.site.showreel_url}
              autoplay
              background
              muted
              className="aspect-video w-full h-full"
              testId="hero-showreel"
            />
            <div className="absolute inset-0 bg-black/30 pointer-events-none" />
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-end px-6 md:px-12 lg:px-16 pb-16 md:pb-24 pt-32">
            <p
              data-testid="hero-tagline"
              className="text-[11px] md:text-xs tracking-[0.32em] uppercase text-white/70 mb-6"
            >
              {tr(content.site.tagline, lang)}
            </p>
            <h1
              data-testid="hero-name"
              className="text-white font-light leading-[0.92] tracking-tight text-5xl md:text-7xl lg:text-8xl xl:text-9xl"
            >
              {content.site.name}
            </h1>
            <p
              data-testid="hero-title"
              className="mt-6 text-white/85 text-sm md:text-base tracking-[0.28em] uppercase"
            >
              {tr(content.site.title, lang)}
            </p>

            <div className="mt-16 flex items-center gap-3 text-white/70 text-[11px] tracking-[0.32em] uppercase">
              <ChevronDown className="w-4 h-4 animate-bounce" strokeWidth={1} />
              <span>{tr(T.hero.scroll, lang)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* SELECTED WORK PREVIEW */}
      <section
        data-testid="home-selected-section"
        className="px-6 md:px-12 lg:px-16 py-24 md:py-32"
      >
        <div className="flex items-baseline justify-between mb-12 md:mb-20">
          <h2 className="text-3xl md:text-5xl lg:text-6xl tracking-tight font-light">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-16 md:gap-y-24">
          {featured.map((p, i) => (
            <div
              key={p.id}
              className={i % 2 === 1 ? "md:mt-24" : ""}
            >
              <ProjectCard project={p} lang={lang} eager={i < 2} />
            </div>
          ))}
        </div>

        <div className="mt-16 md:hidden">
          <Link
            to="/work"
            className="inline-flex items-center gap-2 text-[11px] tracking-[0.28em] uppercase border-b border-black pb-1"
          >
            {tr(T.work.all, lang)} <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
        </div>
      </section>

      {/* CATEGORIES STRIP */}
      <section className="px-6 md:px-12 lg:px-16 pb-24 md:pb-32 border-t border-black/10 pt-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8">
          {CATEGORIES.map((c) => {
            const count = (content.projects || []).filter((p) => p.category === c.id).length;
            return (
              <Link
                key={c.id}
                to={`/work/${c.id}`}
                data-testid={`home-category-${c.id}`}
                className="group block"
              >
                <p className="text-[11px] tracking-[0.32em] uppercase text-neutral-400 mb-2">
                  {String(count).padStart(2, "0")}
                </p>
                <p className="text-xl md:text-2xl tracking-tight text-black group-hover:opacity-60 transition">
                  {c[lang]}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
