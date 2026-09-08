import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ProjectCard } from "./ProjectCard";
import { packJustified, DEFAULT_RATIO } from "../lib/justifiedLayout";

const GAP = 16;

export function HomeStillGrid({ tiles, lang }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [windowH, setWindowH] = useState(
    typeof window !== "undefined" ? window.innerHeight : 900,
  );

  useLayoutEffect(() => {
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

  const items = useMemo(
    () =>
      tiles.map((t, index) => ({
        id: t.project.id || t.project.slug,
        slug: t.project.slug,
        project: t.project,
        still: t.still,
        size: t.size,
        index,
        ratio: t.ratio || DEFAULT_RATIO,
      })),
    [tiles],
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
