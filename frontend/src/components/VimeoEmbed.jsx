const extractVimeoId = (url) => {
  const m = String(url).match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
};

const extractYoutubeId = (url) => {
  const m =
    String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? m[1] : null;
};

export const VimeoEmbed = ({
  url,
  autoplay = false,
  background = false,
  muted = false,
  loop = false,
  className = "",
  testId,
  interactive = true,
  innerRef,
  onIframeLoad,
}) => {
  const vid = extractVimeoId(url);
  const yid = !vid ? extractYoutubeId(url) : null;

  if (!vid && !yid) {
    return (
      <div
        data-testid={testId}
        className={`flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-500 text-sm ${className}`}
      >
        Video URL invalid
      </div>
    );
  }

  let src;
  if (vid) {
    const params = new URLSearchParams({
      title: "0",
      byline: "0",
      portrait: "0",
      dnt: "1",
    });
    if (autoplay) params.set("autoplay", "1");
    if (background) params.set("background", "1");
    if (muted || background) params.set("muted", "1");
    if (loop || background) {
      params.set("loop", "1");
      params.set("autopause", "0");
    }
    params.set("playsinline", "1");
    src = `https://player.vimeo.com/video/${vid}?${params.toString()}`;
  } else {
    const params = new URLSearchParams({ rel: "0", modestbranding: "1" });
    if (autoplay) params.set("autoplay", "1");
    if (muted) params.set("mute", "1");
    if (loop || background) {
      params.set("loop", "1");
      params.set("playlist", yid);
    }
    if (background) {
      params.set("controls", "0");
    }
    src = `https://www.youtube.com/embed/${yid}?${params.toString()}`;
  }

  return (
    <div
      className={`relative w-full ${className} ${interactive ? "" : "pointer-events-none"}`}
      data-testid={testId}
    >
      <iframe
        ref={innerRef}
        src={src}
        title="Video player"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        onLoad={onIframeLoad}
        className={`absolute inset-0 h-full w-full border-0 bg-black ${interactive ? "" : "pointer-events-none"}`}
      />
    </div>
  );
};
