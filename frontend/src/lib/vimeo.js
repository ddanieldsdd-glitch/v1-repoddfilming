export const extractVimeoId = (url) => {
  const m = String(url || "").match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
};

/** Poster estático del showreel (mejora LCP antes de cargar el iframe) */
export const getVimeoPosterUrl = (url) => {
  const id = extractVimeoId(url);
  if (!id) return null;
  return `https://vumbnail.com/${id}.jpg`;
};

/** URL del iframe en modo background (prefetch / hero). */
export const getVimeoBackgroundPlayerUrl = (url) => {
  const id = extractVimeoId(url);
  if (!id) return null;
  const params = new URLSearchParams({
    title: "0",
    byline: "0",
    portrait: "0",
    dnt: "1",
    color: "000000",
    transparent: "0",
    playsinline: "1",
    autoplay: "1",
    background: "1",
    muted: "1",
    loop: "1",
    autopause: "0",
  });
  return `https://player.vimeo.com/video/${id}?${params.toString()}`;
};
