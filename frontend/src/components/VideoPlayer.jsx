import { useEffect, useRef, useCallback, useState } from "react";
import Player from "@vimeo/player";
import {
  registerPlayer,
  unregisterPlayer,
  getGlobalMuted,
} from "../lib/videoStore";

/**
 * Vimeo: @vimeo/player SDK.
 * YouTube (tarjetas / background): IFrame Player API (play/pause al hover).
 * YouTube (hero / interactivo): iframe embed directo (más fiable).
 */
export const VideoPlayer = ({
  url,
  playerKey,
  autoplay = false,
  background = false,
  muted = false,
  loop = false,
  playing,
  className = "",
  testId,
  interactive = true,
  onReady,
  onPlay,
  onPause,
  onError,
  onRef,
}) => {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const readyCalledRef = useRef(false);

  const vimeoId = extractVimeoId(url);
  const ytId = !vimeoId ? extractYoutubeId(url) : null;
  // API solo en tarjetas (background + control playing); hero usa iframe directo
  const useYtApi = Boolean(ytId && background);

  const handleReady = useCallback(() => {
    if (readyCalledRef.current) return;
    readyCalledRef.current = true;
    setReady(true);
    onReady?.();
  }, [onReady]);

  // — Init Vimeo Player via SDK —
  useEffect(() => {
    if (!vimeoId || !containerRef.current) return undefined;

    readyCalledRef.current = false;
    setReady(false);

    const iframe = containerRef.current;
    const player = new Player(iframe);
    playerRef.current = player;

    const safetyTimer = setTimeout(() => {
      handleReady();
    }, 1500);

    player.ready()
      .then(() => {
        if (playerRef.current !== player) return;

        if (background || getGlobalMuted() || muted) {
          player.setMuted(true).catch(() => {});
        }
        if (background) {
          player.setLoop(true).catch(() => {});
        }

        registerPlayer(playerKey, player, { forceMuted: background || muted });
        onRef?.(player, iframe);

        handleReady();

        const shouldAutoplay =
          playing !== false && (autoplay || background || playing === true);
        if (shouldAutoplay) {
          player.play().catch(() => {});
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
      clearTimeout(safetyTimer);
      onRef?.(null, null);
      playerRef.current = null;
      try {
        player.pause().catch(() => {});
        player.setMuted(true).catch(() => {});
      } catch {}
      unregisterPlayer(playerKey);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vimeoId, playerKey]);

  // — Init YouTube Player via IFrame API (solo tarjetas background) —
  useEffect(() => {
    if (!useYtApi || !containerRef.current) return undefined;

    readyCalledRef.current = false;
    setReady(false);

    let cancelled = false;
    const safetyTimer = setTimeout(handleReady, 2000);

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !containerRef.current) return;

        const shouldMute = background || muted || getGlobalMuted();
        const shouldLoop = loop || background;

        const ytPlayer = new YT.Player(containerRef.current, {
          videoId: ytId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            mute: shouldMute ? 1 : 0,
            loop: shouldLoop ? 1 : 0,
            ...(shouldLoop ? { playlist: ytId } : {}),
            fs: 0,
            disablekb: 1,
            iv_load_policy: 3,
            cc_load_policy: 0,
            autohide: 1,
          },
          events: {
            onReady: (event) => {
              if (cancelled) return;

              const adapter = createYoutubeAdapter(event.target);
              playerRef.current = adapter;
              ytPlayerRef.current = event.target;
              registerPlayer(playerKey, adapter, { forceMuted: background || muted });
              onRef?.(adapter, containerRef.current);

              handleReady();

              if (playing === true) {
                event.target.playVideo();
              }
            },
            onStateChange: (event) => {
              if (event.data === YT.PlayerState.PLAYING) onPlay?.();
              if (event.data === YT.PlayerState.PAUSED) onPause?.();
            },
            onError: () => {
              onError?.();
              handleReady();
            },
          },
        });

        ytPlayerRef.current = ytPlayer;
      })
      .catch(() => {
        handleReady();
      });

    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
      onRef?.(null, null);
      playerRef.current = null;
      try {
        ytPlayerRef.current?.destroy?.();
      } catch {}
      ytPlayerRef.current = null;
      unregisterPlayer(playerKey);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytId, playerKey, useYtApi]);

  // Play / pause (Vimeo SDK y adaptador YouTube API)
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !ready || playing === undefined) return undefined;

    let cancelled = false;
    if (playing) {
      player
        .play()
        .then(() => {
          if (!cancelled) onPlay?.();
        })
        .catch(() => {});
    } else {
      player
        .pause()
        .then(() => {
          if (!cancelled) onPause?.();
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [playing, ready, onPlay, onPause]);

  const vimeoSrc = vimeoId ? buildVimeoSrc(vimeoId, { autoplay, background, muted, loop }) : null;
  const ytSrc =
    ytId && !useYtApi
      ? buildYtSrc(ytId, { autoplay, muted, background, loop })
      : null;

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

  const iframeCls = `absolute inset-0 h-full w-full border-0 bg-black [color-scheme:dark] ${interactive ? "" : "pointer-events-none"}`;

  return (
    <div
      className={`relative w-full bg-black ${background && ytId ? "video-bg-cover" : ""} ${className} ${interactive ? "" : "pointer-events-none"}`}
      data-testid={testId}
    >
      {vimeoId ? (
        <iframe
          ref={containerRef}
          src={vimeoSrc || ""}
          title="Video player"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          onLoad={background ? handleReady : undefined}
          className={iframeCls}
        />
      ) : useYtApi ? (
        <div
          ref={containerRef}
          className={`absolute inset-0 h-full w-full overflow-hidden bg-black ${interactive ? "" : "pointer-events-none"}`}
        />
      ) : (
        <iframe
          ref={containerRef}
          src={ytSrc || ""}
          title="Video player"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          onLoad={handleReady}
          className={iframeCls}
        />
      )}
      {!background && (
        <div
          className={`pointer-events-none absolute inset-0 z-[1] bg-black transition-opacity duration-500 ${ready ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        />
      )}
    </div>
  );
};

/* — Helpers — */

let ytApiPromise = null;

const loadYouTubeApi = () => {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.onerror = () => reject(new Error("YouTube API failed to load"));
    document.head.appendChild(tag);
  });

  return ytApiPromise;
};

const createYoutubeAdapter = (player) => ({
  play: () =>
    new Promise((resolve, reject) => {
      try {
        player.playVideo();
        resolve();
      } catch (err) {
        reject(err);
      }
    }),
  pause: () =>
    new Promise((resolve) => {
      try {
        player.pauseVideo();
      } catch {}
      resolve();
    }),
  setMuted: (val) =>
    new Promise((resolve) => {
      try {
        if (val) player.mute();
        else player.unMute();
      } catch {}
      resolve();
    }),
  getPaused: () =>
    new Promise((resolve) => {
      try {
        const state = player.getPlayerState();
        resolve(
          state !== window.YT.PlayerState.PLAYING &&
            state !== window.YT.PlayerState.BUFFERING,
        );
      } catch {
        resolve(true);
      }
    }),
});

const extractVimeoId = (url) => {
  const m = String(url).match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
};

const extractYoutubeId = (url) => {
  const m = String(url).match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/,
  );
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
  if (background || muted) params.set("muted", "1");
  else if (getGlobalMuted()) params.set("muted", "1");
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
