import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
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
      <section className="pt-28 md:pt-32 pb-16 md:pb-24 px-6 md:px-12 lg:px-16">
        <div className="bg-black">
          <VimeoEmbed
            url={content.site.showreel_url}
            autoplay
            background
            muted
            className="aspect-video w-full"
            testId="hero-showreel"
          />
        </div>

        <div className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-end">
          <div className="md:col-span-9">
            <h1
              data-testid="hero-name"
              className="text-black font-light leading-[0.95] tracking-tight text-5xl md:text-7xl lg:text-8xl"
            >
              {content.site.name}
            </h1>
            <p
              data-testid="hero-title"
              className="mt-5 md:mt-6 text-neutral-700 text-sm md:text-base tracking-[0.28em] uppercase"
            >
              {tr(content.site.title, lang)}
            </p>
          </div>
        </div>
      </section>

      {/* SELECTED WORK — full-bleed tiles */}
      <section
        data-testid="home-selected-section"
        className="px-6 md:px-12 lg:px-16 py-20 md:py-28 border-t border-black/10"
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

        <div className="flex flex-col gap-20 md:gap-28">
          {featured.map((p, i) => (
            <ProjectCard key={p.id} project={p} lang={lang} eager={i < 1} />
          ))}
        </div>

        <div className="mt-16 md:hidden">
          <Link
            to="/work"
            data-testid="home-view-all-mobile"
            className="inline-flex items-center gap-2 text-[11px] tracking-[0.28em] uppercase border-b border-black pb-1"
          >
            {tr(T.work.all, lang)} <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
        </div>
      </section>

      {/* CATEGORIES STRIP */}
      <section className="px-6 md:px-12 lg:px-16 pb-24 md:pb-32 border-t border-black/10 pt-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              to={`/work/${c.id}`}
              data-testid={`home-category-${c.id}`}
              className="group block"
            >
              <p className="text-xl md:text-2xl tracking-tight text-black group-hover:opacity-50 transition">
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
