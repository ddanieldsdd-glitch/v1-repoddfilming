import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { VideoPlayer } from "./VideoPlayer";
import { getVimeoPosterUrl } from "../lib/vimeo";
import { isImmersiveHomeHero } from "../lib/homeHero";
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
  const immersive = isImmersiveHomeHero();

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

  const scrollToWork = () => {
    document.getElementById("home-work")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  if (!url) return null;

  return (
    <section
      ref={setSectionEl}
      id="showreel"
      data-testid="home-showreel"
      data-hero-layout={immersive ? "immersive" : "framed"}
    >
      <div
        className={
          immersive
            ? "relative h-svh min-h-svh w-full overflow-hidden bg-neutral-950"
            : "relative aspect-video overflow-hidden rounded-[1.125rem] md:rounded-[1.5rem] bg-neutral-950 ring-1 ring-white/[0.08]"
        }
      >
        {poster && !playing && (
          <img
            src={poster}
            alt=""
            width={1920}
            height={1080}
            loading="eager"
            fetchPriority="high"
            className={`absolute inset-0 z-[1] h-full w-full bg-black ${
              immersive ? "object-cover" : "object-contain"
            }`}
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
            cover={immersive}
            className="absolute inset-0 z-[2] h-full w-full"
            testId="home-showreel-player"
            interactive={false}
            onPlay={() => setPlaying(true)}
          />
        )}
        <div
          className={
            immersive
              ? "pointer-events-none absolute inset-0 z-[3] bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(0,0,0,0.45)_100%)]"
              : "pointer-events-none absolute inset-0 z-[3] bg-gradient-to-t from-black/55 via-transparent to-black/15"
          }
        />
        {immersive && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-[42%] bg-gradient-to-t from-[var(--cinema-bg)] via-black/50 to-transparent" />
        )}

        {immersive ? (
          <div
            className="absolute inset-x-0 bottom-0 z-[4] flex flex-col items-center gap-4 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-10 md:gap-5 md:pb-10"
          >
            <Link
              to="/showreel"
              className="flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-5 py-3 text-[10px] tracking-[0.18em] uppercase text-white backdrop-blur-md transition duration-300 hover:border-white/40 hover:bg-black/65 focus-visible:outline-white md:px-6"
            >
              {tr(T.hero.showreel, lang)}
              <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </Link>
            <button
              type="button"
              onClick={scrollToWork}
              className="flex flex-col items-center gap-1.5 text-[9px] tracking-[0.22em] uppercase text-white/55 transition hover:text-white/85"
              aria-label={tr(T.hero.scroll, lang)}
            >
              <span>{tr(T.hero.scroll, lang)}</span>
              <ChevronDown className="h-4 w-4 animate-bounce" strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <Link
            to="/showreel"
            className="absolute right-4 bottom-4 z-[4] flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-4 py-2.5 text-[10px] tracking-[0.16em] uppercase text-white backdrop-blur-md transition duration-300 hover:border-white/35 hover:bg-black/65 focus-visible:outline-white md:right-6 md:bottom-6 md:px-5"
          >
            {tr(T.hero.showreel, lang)}
            <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
        )}
      </div>
    </section>
  );
}
