import { useEffect, useRef, useCallback, useState } from "react";
import Player from "@vimeo/player";
import {
  registerPlayer,
  unregisterPlayer,
  getGlobalMuted,
} from "../lib/videoStore";

/**
 * Reliable video player using @vimeo/player SDK.
 * Supports Vimeo and YouTube (via native iframe for YouTube).
 *
 * The iframe is rendered by React (not created via document.createElement)
 * to avoid React reconciliation conflicts with player.destroy().
 */
export const VideoPlayer = ({
  url,
  playerKey,
  autoplay = false,
  background = false,
  muted = false,
  loop = false,
  className = "",
  testId,
  interactive = true,
  onReady,
  onPlay,
  onPause,
  onError,
}) => {
  const iframeRef = useRef(null);
  const playerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const initialMounted = useRef(true);

  const vimeoId = extractVimeoId(url);
  const ytId = !vimeoId ? extractYoutubeId(url) : null;

  const handleReady = useCallback(() => {
    setReady(true);
    onReady?.();
  }, [onReady]);

  // — Init Vimeo Player via SDK, attached to the React-owned iframe —
  useEffect(() => {
    if (!vimeoId || !iframeRef.current) return undefined;
    initialMounted.current = true;

    const iframe = iframeRef.current;
    const player = new Player(iframe);
    playerRef.current = player;

    player.ready()
      .then(() => {
        if (!initialMounted.current) return;

        if (background || getGlobalMuted() || muted) {
          player.setMuted(true).catch(() => {});
        }
        if (background) {
          player.setLoop(true).catch(() => {});
        }

        registerPlayer(playerKey, player);

        if (autoplay || background) {
          player.play().then(handleReady).catch(() => {
            handleReady();
          });
        } else {
          handleReady();
        }
      })
      .catch(() => {
        handleReady();
      });

    const onPlayEvent = () => onPlay?.();
    const onPauseEvent = () => onPause?.();
    const onErrorEvent = (err) => {
      console.warn("[VideoPlayer] error:", err?.message || err);
      onError?.(err);
    };

    player.on("play", onPlayEvent);
    player.on("pause", onPauseEvent);
    player.on("error", onErrorEvent);

    return () => {
      initialMounted.current = false;
      try {
        player.pause().catch(() => {});
        player.setMuted(true).catch(() => {});
        player.destroy().catch(() => {});
      } catch {}
      unregisterPlayer(playerKey);
      playerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vimeoId, playerKey]);

  // Build iframe src for Vimeo
  const vimeoSrc = vimeoId ? buildVimeoSrc(vimeoId, { autoplay, background, muted, loop }) : null;

  // Build iframe src for YouTube
  const ytSrc = ytId && !vimeoId ? buildYtSrc(ytId, { autoplay, muted, background, loop }) : null;

  // — Nothing valid —
  if (!vimeoId && !ytId) {
    return (
      <div
        data-testid={testId}
        className={`flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-500 text-sm ${className}`}
      >
        Video URL invalid
      </div>
    );
  }

  return (
    <div
      className={`relative w-full bg-black ${className} ${interactive ? "" : "pointer-events-none"}`}
      data-testid={testId}
    >
      <iframe
        ref={iframeRef}
        src={vimeoSrc || ytSrc || ""}
        title="Video player"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        loading="eager"
        onLoad={vimeoId ? undefined : handleReady}
        className={`absolute inset-0 h-full w-full border-0 bg-black [color-scheme:dark] ${interactive ? "" : "pointer-events-none"}`}
      />
      {!ready && (
        <div className="pointer-events-none absolute inset-0 z-[1] bg-black" />
      )}
    </div>
  );
};

/* — Helpers — */

const extractVimeoId = (url) => {
  const m = String(url).match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
};

const extractYoutubeId = (url) => {
  const m =
    String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? m[1] : null;
};

const buildVimeoSrc = (id, { autoplay, background, muted, loop }) => {
  const params = new URLSearchParams({
    title: "0",
    byline: "0",
    portrait: "0",
    dnt: "1",
    color: "000000",
    transparent: "0",
    playsinline: "1",
  });
  if (autoplay) params.set("autoplay", "1");
  if (background) params.set("background", "1");
  // Always force muted=1 when the muted prop is true or in background mode
  if (background || muted || getGlobalMuted()) params.set("muted", "1");
  if (loop || background) {
    params.set("loop", "1");
    params.set("autopause", "0");
  }
  return `https://player.vimeo.com/video/${id}?${params.toString()}`;
};

const buildYtSrc = (id, { autoplay, muted, background, loop }) => {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    enablejsapi: "1",
    playsinline: "1",
  });
  if (autoplay) params.set("autoplay", "1");
  if (getGlobalMuted() || muted || background) params.set("mute", "1");
  if (loop || background) {
    params.set("loop", "1");
    params.set("playlist", id);
  }
  if (background) params.set("controls", "0");
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
};