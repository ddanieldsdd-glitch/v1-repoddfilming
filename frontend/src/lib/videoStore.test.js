import {
  HOME_SHOWREEL_KEY,
  observePlayerRecovery,
  pauseAllExcept,
  registerPlayer,
  resumePlayer,
  unregisterPlayer,
} from "./videoStore";

const originalIntersectionObserver = global.IntersectionObserver;

const player = () => ({
  play: jest.fn(() => Promise.resolve()),
  pause: jest.fn(() => Promise.resolve()),
  setMuted: jest.fn(() => Promise.resolve()),
  destroy: jest.fn(() => Promise.resolve()),
});

describe("videoStore home showreel", () => {
  afterEach(() => {
    unregisterPlayer(HOME_SHOWREEL_KEY);
    unregisterPlayer("card-preview-test");
    global.IntersectionObserver = originalIntersectionObserver;
    jest.restoreAllMocks();
  });

  test("resumes the same showreel key after a card preview pauses it", () => {
    const showreel = player();
    const preview = player();
    registerPlayer(HOME_SHOWREEL_KEY, showreel, { forceMuted: true });
    registerPlayer("card-preview-test", preview, { forceMuted: true });

    pauseAllExcept("card-preview-test");
    resumePlayer(HOME_SHOWREEL_KEY);

    expect(showreel.pause).not.toHaveBeenCalled();
    expect(showreel.play).toHaveBeenCalled();
    expect(preview.pause).not.toHaveBeenCalled();
  });

  test("recovers playback when the showreel enters the viewport", () => {
    const showreel = player();
    registerPlayer(HOME_SHOWREEL_KEY, showreel, { forceMuted: true });

    let intersectionCallback;
    const disconnect = jest.fn();
    global.IntersectionObserver = jest.fn((callback) => {
      intersectionCallback = callback;
      return { observe: jest.fn(), disconnect };
    });

    const cleanup = observePlayerRecovery(
      HOME_SHOWREEL_KEY,
      document.createElement("section"),
    );
    intersectionCallback([{ isIntersecting: true }]);

    expect(showreel.play).toHaveBeenCalled();
    cleanup();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
