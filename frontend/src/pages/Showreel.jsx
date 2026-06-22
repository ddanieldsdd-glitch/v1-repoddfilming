import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { VideoPlayer } from "../components/VideoPlayer";
import { extractVimeoId, getVimeoPosterUrl } from "../lib/vimeo";
import { getSiteDescription } from "../lib/seo";

export default function Showreel() {
  const content = useContent();
  const [lang] = useLang();
  const url = content.site?.showreel_url;
  const vimeoId = extractVimeoId(url);
  const poster = getVimeoPosterUrl(url);
  const name = content.site?.name || "Dani Díaz";
  const title = `${tr(T.hero.showreel, lang)} — ${name}`;
  const description =
    lang === "es"
      ? `Showreel de ${name}, Director de Fotografía. Selección de trabajos en ficción, documental, publicidad y videoclips.`
      : `Showreel by ${name}, Cinematographer. A selection of fiction, documentary, commercials and music videos.`;

  useEffect(() => {
    if (!vimeoId) return undefined;

    const thumb = poster || content.site?.logo_white || "";
    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": "https://ddanidiaz.com/showreel#webpage",
          url: "https://ddanidiaz.com/showreel",
          name: title,
          description: getSiteDescription(content, lang) || description,
          inLanguage: lang,
        },
        {
          "@type": "VideoObject",
          "@id": "https://ddanidiaz.com/showreel#video",
          name: title,
          description,
          thumbnailUrl: thumb,
          contentUrl: `https://vimeo.com/${vimeoId}`,
          embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
          url: "https://ddanidiaz.com/showreel",
          uploadDate: "2024-01-01T00:00:00+00:00",
        },
      ],
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "showreel-jsonld";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => document.getElementById("showreel-jsonld")?.remove();
  }, [content, lang, vimeoId, poster, title, description, name]);

  if (!url) {
    return (
      <div className="min-h-screen bg-black text-white pt-32 px-6">
        <p className="text-neutral-500">{lang === "es" ? "Showreel no disponible." : "Showreel unavailable."}</p>
        <Link to="/" className="mt-6 inline-block text-sm border-b border-white pb-1">
          {lang === "es" ? "Volver" : "Back"}
        </Link>
      </div>
    );
  }

  return (
    <div
      data-testid="showreel-page"
      className="min-h-screen bg-black text-white pt-28 sm:pt-32 md:pt-36 pb-16 px-4 sm:px-6 md:px-12"
    >
      <div className="max-w-5xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[11px] tracking-[0.24em] uppercase text-white/50 hover:text-white transition-colors mb-10"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          {lang === "es" ? "Inicio" : "Home"}
        </Link>

        <header className="mb-8 md:mb-10">
          <p className="text-[10px] tracking-[0.32em] uppercase text-white/40 mb-3">
            {tr(T.hero.showreel, lang)}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight">{name}</h1>
          <p className="mt-4 text-base md:text-lg text-white/60 max-w-2xl leading-relaxed">{description}</p>
        </header>

        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-neutral-950 ring-1 ring-white/10 shadow-[0_32px_100px_-24px_rgba(0,0,0,0.9)] aspect-video">
          <VideoPlayer
            url={url}
            playerKey="showreel-page"
            autoplay
            className="h-full w-full"
            testId="showreel-player"
            interactive
          />
        </div>
      </div>
    </div>
  );
}
