import { useEffect, useMemo, useRef, useState } from "react";
import { ProjectCard } from "./ProjectCard";
import { packJustified, DEFAULT_RATIO } from "../lib/justifiedLayout";
import { stripCloudinaryTransforms } from "../lib/cloudinary";

const GAP = 16;

export function HomeStillGrid({ tiles, lang }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [ratios, setRatios] = useState({});
  const [windowH, setWindowH] = useState(
    typeof window !== "undefined" ? window.innerHeight : 900,
  );

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const read = () => setWidth(Math.round(el.getBoundingClientRect().width));
    const ro = new ResizeObserver(read);
    ro.observe(el);
    read();
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onResize = () => setWindowH(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const stillKey = tiles.map((t) => `${t.project.slug}:${t.still}`).join("|");

  useEffect(() => {
    const urls = [...new Set(tiles.map((t) => t.still).filter(Boolean))];
    urls.forEach((url) => {
      const img = new Image();
      img.onload = () => {
        if (!img.naturalWidth || !img.naturalHeight) return;
        const next = img.naturalWidth / img.naturalHeight;
        setRatios((prev) => (prev[url] === next ? prev : { ...prev, [url]: next }));
      };
      img.src = stripCloudinaryTransforms(url) || url;
    });
    // stillKey captures slug+url identity without depending on a new array each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stillKey]);

  const items = useMemo(
    () =>
      tiles.map((t, index) => ({
        id: t.project.id || t.project.slug,
        slug: t.project.slug,
        project: t.project,
        still: t.still,
        size: t.size,
        index,
        ratio: ratios[t.still] || DEFAULT_RATIO,
      })),
    [tiles, ratios],
  );

  const rows = useMemo(
    () =>
      packJustified(items, width, {
        gap: GAP,
        minH: width < 640 ? 180 : 240,
        maxH: Math.round(windowH * (width < 640 ? 0.48 : 0.46)),
        windowH,
        maxPerRow: width < 640 ? 1 : 2,
        soloAll: false,
      }),
    [items, width, windowH],
  );

  return (
    <div
      ref={wrapRef}
      data-testid="home-still-grid"
      className="flex flex-col"
      style={{ gap: GAP }}
    >
      {rows.map((row) => (
        <div
          key={row.map((item) => item.id).join("-")}
          className="flex justify-center"
          style={{ gap: GAP }}
        >
          {row.map((item) => (
            <div
              key={item.id}
              data-testid={`home-tile-${item.slug}`}
              className="shrink-0"
              style={{ width: item.width, height: item.height }}
            >
              <ProjectCard
                project={item.project}
                lang={lang}
                cardSurface="home"
                eager={item.index < 4}
                index={item.index}
                fill
                fit="contain"
                ratio={item.ratio}
                imageOverride={item.still}
                previewCrop={item.project.preview_crop ?? item.project.work_crop}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
