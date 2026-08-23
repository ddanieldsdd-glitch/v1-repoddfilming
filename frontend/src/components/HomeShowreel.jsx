import { Link } from "react-router-dom";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { VideoPlayer } from "./VideoPlayer";
import { getVimeoPosterUrl } from "../lib/vimeo";

export function HomeShowreel({ url }) {
  const [lang] = useLang();
  const [playing, setPlaying] = useState(false);
  const poster = getVimeoPosterUrl(url);

  if (!url) return null;

  return (
    <section
      id="showreel"
      data-testid="home-showreel"
      className="mb-6 md:mb-8"
    >
      <div className="relative aspect-video overflow-hidden rounded-[1.75rem] md:rounded-[2.1rem] bg-neutral-950 ring-1 ring-white/10 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.9)]">
        {poster && !playing && (
          <img
            src={poster}
            alt=""
            className="absolute inset-0 z-[1] h-full w-full object-contain bg-black"
          />
        )}
        <VideoPlayer
          url={url}
          playerKey="home-showreel"
          autoplay
          muted
          loop
          background
          cover={false}
          className="absolute inset-0 z-[2] h-full w-full"
          testId="home-showreel-player"
          interactive={false}
          onPlay={() => setPlaying(true)}
        />
        <div className="pointer-events-none absolute inset-0 z-[3] bg-gradient-to-t from-black/50 via-transparent to-black/10" />
        <Link
          to="/showreel"
          className="absolute right-4 bottom-4 z-[4] flex items-center gap-2 rounded-full border border-white/25 bg-black/50 px-4 py-2 text-[10px] tracking-[0.24em] uppercase text-white backdrop-blur-md transition hover:bg-black/70"
        >
          {tr(T.hero.showreel, lang)}
          <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.5} />
        </Link>
      </div>
    </section>
  );
}
