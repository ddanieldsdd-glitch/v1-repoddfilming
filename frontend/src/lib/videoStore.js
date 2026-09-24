/**
 * Global video player store
 * Manages all active Vimeo Player instances, global mute state, and provides
 * reliable mute/pause/unmute across all players.
 */

const PLAYERS = new Map(); // key → Vimeo Player instance
const POSITIONS = new Map(); // key → segundos al pausar
const listeners = new Set();
/** Players observed for viewport: only resume while intersecting. */
const VIEW_GATED = new Set();
const IN_VIEW = new Set();

export const HOME_SHOWREEL_KEY = "home-showreel";

let _globalMuted = false;
if (typeof window !== "undefined") {
  try {
    _globalMuted = localStorage.getItem("ddp_global_muted") === "true";
  } catch {}
}

const notify = () => listeners.forEach((fn) => fn(_globalMuted));

export const getGlobalMuted = () => _globalMuted;

export const setGlobalMuted = (val) => {
  _globalMuted = val;
  try {
    localStorage.setItem("ddp_global_muted", val ? "true" : "false");
  } catch {}
  // Apply to all players in real time
  PLAYERS.forEach((player) => {
    try {
      player.setMuted(val).catch(() => {});
    } catch {}
  });
  notify();
};

export const toggleGlobalMuted = () => setGlobalMuted(!_globalMuted);

export const subscribeGlobalMuted = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/* — Player registry — */

export const registerPlayer = (key, player, { forceMuted = false } = {}) => {
  if (PLAYERS.has(key) && PLAYERS.get(key) !== player) {
    // Destroy old player if it was replaced
    try {
      PLAYERS.get(key).destroy().catch(() => {});
    } catch {}
  }
  PLAYERS.set(key, player);
  try {
    player.setMuted(forceMuted || _globalMuted).catch(() => {});
  } catch {}
};

export const unregisterPlayer = (key) => {
  PLAYERS.delete(key);
};

export const getPlayer = (key) => PLAYERS.get(key) || null;

/* — Bulk operations — */

/** Pauses ALL registered players. */
export const pauseAll = () => {
  PLAYERS.forEach((player) => {
    try {
      player.pause().catch(() => {});
    } catch {}
  });
};

/** Mutes ALL registered players. */
export const muteAll = () => {
  PLAYERS.forEach((player) => {
    try {
      player.setMuted(true).catch(() => {});
    } catch {}
  });
};

/** Pauses all players except the one with the given key. */
export const pauseAllExcept = (exceptKey) => {
  PLAYERS.forEach((player, key) => {
    if (key === exceptKey || key === HOME_SHOWREEL_KEY) return;
    try {
      player.pause().catch(() => {});
    } catch {}
  });
};

const rememberPosition = (key, player) => {
  if (!player?.getCurrentTime) return;
  player
    .getCurrentTime()
    .then((time) => {
      if (Number.isFinite(time) && time > 0.2) POSITIONS.set(key, time);
    })
    .catch(() => {});
};

export const getSavedTime = (key) => POSITIONS.get(key) || 0;

export const pausePlayer = (key) => {
  const player = PLAYERS.get(key);
  if (!player) return;
  rememberPosition(key, player);
  try {
    player.pause().catch(() => {});
  } catch {}
};

const restorePosition = async (key, player) => {
  const saved = POSITIONS.get(key);
  if (!saved || saved <= 0.2 || !player.setCurrentTime) return;
  try {
    await player.setCurrentTime(saved);
  } catch {}
};

export const resumePlayer = (key, retries = 0) => {
  if (VIEW_GATED.has(key) && !IN_VIEW.has(key)) return;
  const player = PLAYERS.get(key);
  if (!player) return;
  const retry = () => {
    if (retries < 12) {
      window.setTimeout(() => resumePlayer(key, retries + 1), 160 + retries * 90);
    }
  };
  const start = async () => {
    try {
      player.setMuted?.(true)?.catch?.(() => {});
    } catch {}
    let paused = true;
    if (player.getPaused) {
      try {
        paused = await player.getPaused();
      } catch {
        paused = true;
      }
    }
    if (!paused) return;
    await restorePosition(key, player);
    await player.play();
  };
  return Promise.resolve(start()).catch(retry);
};

/**
 * Recupera la reproducción al volver a ser visible y pausa al salir del
 * viewport (scroll, pestaña oculta o bfcache).
 */
export const observePlayerRecovery = (key, element) => {
  if (!element || typeof document === "undefined" || typeof window === "undefined") {
    return () => {};
  }

  VIEW_GATED.add(key);
  IN_VIEW.add(key);

  let inView = true;
  let watchdog = null;

  const stopWatchdog = () => {
    if (watchdog) {
      window.clearInterval(watchdog);
      watchdog = null;
    }
  };

  const resumeIfVisible = () => {
    if (document.hidden || !inView) return;
    resumePlayer(key);
    const player = PLAYERS.get(key);
    if (player?.getPaused) {
      player
        .getPaused()
        .then((paused) => {
          if (paused && !document.hidden && inView) resumePlayer(key);
        })
        .catch(() => {});
    }
  };

  const startWatchdog = () => {
    if (watchdog) return;
    watchdog = window.setInterval(resumeIfVisible, 1200);
  };

  const onVisibilityChange = () => resumeIfVisible();
  const onPageShow = () => resumeIfVisible();

  const observer =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          ([entry]) => {
            inView = Boolean(entry?.isIntersecting);
            if (inView) {
              IN_VIEW.add(key);
              resumeIfVisible();
              startWatchdog();
            } else {
              IN_VIEW.delete(key);
              stopWatchdog();
              pausePlayer(key);
            }
          },
          { threshold: [0, 0.08, 0.2], rootMargin: "0px" },
        )
      : null;

  observer?.observe(element);
  startWatchdog();
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pageshow", onPageShow);

  return () => {
    stopWatchdog();
    observer?.disconnect();
    VIEW_GATED.delete(key);
    IN_VIEW.delete(key);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pageshow", onPageShow);
  };
};

/**
 * Unmutes only a specific player (while respecting global mute).
 * Returns true if successful.
 */
export const unmutePlayer = (key) => {
  const player = PLAYERS.get(key);
  if (player && !_globalMuted) {
    try {
      player.setMuted(false).catch(() => {});
      return true;
    } catch {}
  }
  return false;
};

/**
 * Mutes only a specific player.
 */
export const mutePlayer = (key) => {
  const player = PLAYERS.get(key);
  if (player) {
    try {
      player.setMuted(true).catch(() => {});
    } catch {}
  }
};

/**
 * Pauses all players and returns a function to restore playback
 * for a specific key. Useful for transitions.
 */
export const silenceAllWithRestore = (keepKey) => {
  const prevState = {};
  PLAYERS.forEach((player, key) => {
    try {
      player.getPaused().then((isPaused) => {
        prevState[key] = isPaused;
      }).catch(() => {});
      player.pause().catch(() => {});
    } catch {}
  });
  return () => {
    if (keepKey) {
      const player = PLAYERS.get(keepKey);
      if (player) {
        try {
          player.play().catch(() => {});
        } catch {}
      }
    }
  };
};