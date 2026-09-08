import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { VideoPlayer } from "./VideoPlayer";
import { getVimeoPosterUrl } from "../lib/vimeo";
import {
  HOME_SHOWREEL_KEY,
  observePlayerRecovery,
} from "../lib/videoStore";

export function HomeShowreel({ url }) {
  const [lang] = useLang();
  const [playing, setPlaying] = useState(false);
  const [loadPlayer, setLoadPlayer] = useState(false);
  const [sectionEl, setSectionEl] = useState(null);
  const poster = getVimeoPosterUrl(url);

  useEffect(
    () => observePlayerRecovery(HOME_SHOWREEL_KEY, sectionEl),
    [sectionEl],
  );

  useEffect(() => {
    const start = () => setLoadPlayer(true);
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(start, { timeout: 800 });
      return () => cancelIdleCallback(id);
    }
    const timer = window.setTimeout(start, 400);
    return () => window.clearTimeout(timer);
  }, [url]);

  if (!url) return null;

  return (
    <section
      ref={setSectionEl}
      id="showreel"
      data-testid="home-showreel"
    >
      <div className="relative aspect-video overflow-hidden rounded-[1.125rem] md:rounded-[1.5rem] bg-neutral-950 ring-1 ring-white/[0.08]">
        {poster && !playing && (
          <img
            src={poster}
            alt=""
            width={1920}
            height={1080}
            loading="eager"
            fetchPriority="high"
            className="absolute inset-0 z-[1] h-full w-full object-contain bg-black"
          />
        )}
        {loadPlayer && (
          <VideoPlayer
            url={url}
            playerKey={HOME_SHOWREEL_KEY}
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
        )}
        <div className="pointer-events-none absolute inset-0 z-[3] bg-gradient-to-t from-black/55 via-transparent to-black/15" />
        <Link
          to="/showreel"
          className="absolute right-4 bottom-4 z-[4] flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-4 py-2.5 text-[10px] tracking-[0.16em] uppercase text-white backdrop-blur-md transition duration-300 hover:border-white/35 hover:bg-black/65 focus-visible:outline-white md:right-6 md:bottom-6 md:px-5"
        >
          {tr(T.hero.showreel, lang)}
          <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.5} />
        </Link>
      </div>
    </section>
  );
}
