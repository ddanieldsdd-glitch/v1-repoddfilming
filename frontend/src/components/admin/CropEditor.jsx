import { useEffect, useMemo, useState } from "react";
import {
  defaultHomeCrop,
  defaultWorkCrop,
  FULL_CROP,
  homeCropFromPanZoom,
  normalizeCrop,
  panZoomFromCrop,
  workCropFromPanZoom,
} from "../../lib/crop";

const ASPECT_PRESETS = [
  { id: "native", label: "Original" },
  { id: "16:9", label: "16:9" },
  { id: "2.39", label: "2.39" },
  { id: "4:3", label: "4:3" },
];

export function CropEditor({
  imageUrl,
  crop,
  onChange,
  mode = "free",
  label = "Recorte",
}) {
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [panX, setPanX] = useState(0.5);
  const [panY, setPanY] = useState(0.5);
  const [zoom, setZoom] = useState(1);
  const [aspectId, setAspectId] = useState("native");

  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.onload = () => {
      setDims({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (!dims.w || !dims.h) return;
    const parsed = panZoomFromCrop(crop, dims.w, dims.h, mode === "16:9" ? "16:9" : "free");
    setPanX(parsed.panX);
    setPanY(parsed.panY);
    setZoom(parsed.zoom);
    if (mode === "free") setAspectId(presetFromWH(parsed.aspectWH, dims.w, dims.h));
  }, [crop, dims.w, dims.h, mode]);

  const aspectWH = useMemo(() => {
    if (mode === "16:9") return null;
    if (aspectId === "native" && dims.w && dims.h) {
      const c = normalizeCrop(crop);
      return c.w / c.h;
    }
    if (aspectId === "16:9") return (16 / 9) * (dims.h / dims.w);
    if (aspectId === "2.39") return 2.39 * (dims.h / dims.w);
    if (aspectId === "4:3") return (4 / 3) * (dims.h / dims.w);
    return 1;
  }, [aspectId, dims, crop, mode]);

  const apply = (nextPanX, nextPanY, nextZoom, nextAspectId = aspectId) => {
    if (!dims.w || !dims.h) return;
    let next;
    if (mode === "16:9") {
      next = workCropFromPanZoom(nextPanX, nextPanY, nextZoom, dims.w, dims.h);
    } else {
      let wh = aspectWH;
      if (nextAspectId !== aspectId) {
        if (nextAspectId === "native") wh = dims.w / dims.h;
        else if (nextAspectId === "16:9") wh = (16 / 9) * (dims.h / dims.w);
        else if (nextAspectId === "2.39") wh = 2.39 * (dims.h / dims.w);
        else if (nextAspectId === "4:3") wh = (4 / 3) * (dims.h / dims.w);
      }
      next = homeCropFromPanZoom(nextPanX, nextPanY, nextZoom, wh, dims.w, dims.h);
    }
    onChange(next);
  };

  const reset = () => {
    if (mode === "16:9") {
      onChange(defaultWorkCrop(dims.w, dims.h));
    } else {
      onChange(defaultHomeCrop());
      setAspectId("native");
    }
  };

  if (!imageUrl) {
    return (
      <p className="text-xs text-neutral-500">Elige un still para ajustar el recorte.</p>
    );
  }

  const previewCrop = mode === "16:9"
    ? workCropFromPanZoom(panX, panY, zoom, dims.w, dims.h)
    : homeCropFromPanZoom(panX, panY, zoom, aspectWH || 1, dims.w, dims.h);

  return (
    <div className="space-y-3" data-testid={`crop-editor-${mode}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] tracking-[0.22em] uppercase text-neutral-500">{label}</p>
        <button
          type="button"
          onClick={reset}
          className="text-[10px] tracking-[0.18em] uppercase text-neutral-400 hover:text-white transition"
        >
          Reset
        </button>
      </div>
      <div className="relative aspect-video max-w-md rounded-lg overflow-hidden bg-black border border-white/10">
        <CropPreview imageUrl={imageUrl} crop={previewCrop} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
        {mode === "free" && (
          <label className="block text-[10px] text-neutral-500 uppercase tracking-wider">
            Proporción
            <select
              className="mt-1 w-full bg-black border border-white/15 rounded px-2 py-1.5 text-sm text-white"
              value={aspectId}
              onChange={(e) => {
                setAspectId(e.target.value);
                apply(panX, panY, zoom, e.target.value);
              }}
            >
              {ASPECT_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </label>
        )}
        <label className="block text-[10px] text-neutral-500 uppercase tracking-wider">
          Zoom
          <input
            type="range"
            min={0.15}
            max={1}
            step={0.01}
            value={zoom}
            onChange={(e) => {
              const z = parseFloat(e.target.value);
              setZoom(z);
              apply(panX, panY, z);
            }}
            className="mt-1 w-full accent-white"
          />
        </label>
        <label className="block text-[10px] text-neutral-500 uppercase tracking-wider">
          Horizontal
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={panX}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setPanX(v);
              apply(v, panY, zoom);
            }}
            className="mt-1 w-full accent-white"
          />
        </label>
        <label className="block text-[10px] text-neutral-500 uppercase tracking-wider">
          Vertical
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={panY}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setPanY(v);
              apply(panX, v, zoom);
            }}
            className="mt-1 w-full accent-white"
          />
        </label>
      </div>
    </div>
  );
}

function CropPreview({ imageUrl, crop }) {
  const c = normalizeCrop(crop);
  return (
    <div className="absolute inset-0 overflow-hidden">
      <img
        src={imageUrl}
        alt=""
        className="absolute max-w-none"
        style={{
          width: `${100 / c.w}%`,
          height: `${100 / c.h}%`,
          left: `${(-c.x / c.w) * 100}%`,
          top: `${(-c.y / c.h) * 100}%`,
        }}
      />
    </div>
  );
}

function presetFromWH(wh, imgW, imgH) {
  if (!imgW || !imgH) return "native";
  const native = imgW / imgH;
  const cropAr = wh * (imgW / imgH);
  if (Math.abs(cropAr - native) < 0.05) return "native";
  if (Math.abs(cropAr - 16 / 9) < 0.05) return "16:9";
  if (Math.abs(cropAr - 2.39) < 0.08) return "2.39";
  if (Math.abs(cropAr - 4 / 3) < 0.05) return "4:3";
  return "native";
}

export { FULL_CROP, defaultHomeCrop, defaultWorkCrop };
