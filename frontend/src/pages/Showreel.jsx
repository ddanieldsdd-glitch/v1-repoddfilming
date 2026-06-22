import { useEffect } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
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
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") window.history.back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <Link
          to="/"
          className="text-sm text-white/50 hover:text-white border-b border-white/30 pb-1"
          aria-label={lang === "es" ? "Volver al inicio" : "Back to home"}
        >
          ←
        </Link>
      </div>
    );
  }

  return (
    <div
      data-testid="showreel-page"
      className="fixed inset-0 z-40 bg-black"
    >
      <h1 className="sr-only">{title}</h1>

      <div className="absolute inset-0 bg-black hero-fullscreen">
          <VideoPlayer
            url={url}
            playerKey="showreel-page"
            autoplay
            className="h-full w-full"
            testId="showreel-player"
            interactive
          />
      </div>

      <Link
        to="/"
        className="absolute right-4 top-4 sm:right-6 sm:top-6 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/70 backdrop-blur-md transition hover:border-white/40 hover:text-white"
        aria-label={lang === "es" ? "Cerrar showreel" : "Close showreel"}
      >
        <X className="h-4 w-4" strokeWidth={1.5} />
      </Link>
    </div>
  );
}
