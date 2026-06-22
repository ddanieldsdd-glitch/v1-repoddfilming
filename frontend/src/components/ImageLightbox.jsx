import { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  optimizeCloudinaryUrl,
  cloudinaryResponsive,
  IMG,
  LIGHTBOX_PRESET,
  LIGHTBOX_PREVIEW_WIDTH,
} from "../lib/cloudinary";

const lightboxHdSrc = (url) => {
  if (!url) return url;
  const { src } = cloudinaryResponsive(url, LIGHTBOX_PRESET);
  return src;
};

const lightboxPreviewSrc = (url) =>
  url
    ? optimizeCloudinaryUrl(url, { width: LIGHTBOX_PREVIEW_WIDTH, quality: "good" })
    : url;

const thumbSrc = (url) =>
  url ? optimizeCloudinaryUrl(url, { width: IMG.stillThumb }) : url;

const prefetchLightboxSrc = (url) => {
  const src = lightboxHdSrc(url);
  if (!src) return;
  const img = new Image();
  img.decoding = "async";
  img.src = src;
};

function LightboxImage({ src, closing, label, title, index }) {
  const [displaySrc, setDisplaySrc] = useState(() => lightboxPreviewSrc(src));
  const [hdReady, setHdReady] = useState(false);

  useEffect(() => {
    const preview = lightboxPreviewSrc(src);
    const hd = lightboxHdSrc(src);
    setDisplaySrc(preview);
    setHdReady(false);

    if (!hd || hd === preview) {
      setHdReady(true);
      return undefined;
    }

    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      setDisplaySrc(hd);
      setHdReady(true);
    };
    img.src = hd;

    return () => {
      img.onload = null;
    };
  }, [src]);

  return (
    <img
      src={displaySrc}
      alt={label ? `${label} ${index + 1}` : title || ""}
      draggable={false}
      decoding="async"
      className={`max-h-full max-w-full w-auto object-contain rounded-xl md:rounded-2xl shadow-[0_32px_120px_-24px_rgba(0,0,0,0.95)] ring-1 ring-white/10 cursor-default select-none transition-[opacity,transform,filter] duration-300 ${
        hdReady ? "blur-0" : "blur-[0.4px]"
      } ${
        closing
          ? "opacity-0 scale-[0.97]"
          : "opacity-100 scale-100 animate-[ddpFadeUp_320ms_ease-out_both]"
      }`}
    />
  );
}

export function ImageLightbox({
  open,
  closing = false,
  onClose,
  images = [],
  index = 0,
  onIndexChange,
  label = "",
  title = "",
  lang = "es",
}) {
  const touchStartRef = useRef({ x: 0, y: 0 });

  const count = images.length;
  const hasMultiple = count > 1;
  const currentSrc = images[index];

  const goTo = useCallback(
    (nextIndex) => {
      if (!onIndexChange || count <= 1) return;
      onIndexChange(nextIndex);
    },
    [count, onIndexChange],
  );

  const nextImage = useCallback(() => {
    goTo((index + 1) % count);
  }, [count, goTo, index]);

  const prevImage = useCallback(() => {
    goTo((index - 1 + count) % count);
  }, [count, goTo, index]);

  const handleTouchStart = (e) => {
    const touch = e.touches?.[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e) => {
    if (count <= 1) return;
    const touch = e.changedTouches?.[0];
    if (!touch) return;
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    if (dx < 0) nextImage();
    else prevImage();
  };

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, nextImage, prevImage]);

  // Precargar fotogramas adyacentes en lightbox
  useEffect(() => {
    if (!open || count <= 1) return;
    prefetchLightboxSrc(images[(index + 1) % count]);
    prefetchLightboxSrc(images[(index - 1 + count) % count]);
  }, [open, index, images, count]);

  if (!open || !currentSrc) return null;

  const stop = (e) => e.stopPropagation();

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || label || (lang === "es" ? "Visor de imagen" : "Image viewer")}
      className={`image-lightbox fixed inset-0 z-[99999] cursor-zoom-out transition-opacity duration-300 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
      onClick={onClose}
    >
      {/* Fondo cinematográfico */}
      <div className="absolute inset-0 bg-black" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.45)_100%)]"
        aria-hidden="true"
      />

      {/* Cabecera — clic fuera de la imagen también cierra */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="pointer-events-auto flex items-start justify-between px-5 pt-5 pb-16 md:px-10 md:pt-7 bg-gradient-to-b from-black/90 via-black/45 to-transparent">
          <div className="min-w-0 pr-6">
            {label && (
              <p className="text-[9px] tracking-[0.35em] uppercase text-white/35 mb-1.5">
                {label}
              </p>
            )}
            {title && (
              <p className="text-sm sm:text-base font-light text-white/85 tracking-tight truncate">
                {title}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {hasMultiple && (
              <span className="text-[11px] tracking-[0.25em] text-white/40 tabular-nums">
                {String(index + 1).padStart(2, "0")}
                <span className="opacity-50">&thinsp;/&thinsp;</span>
                {String(count).padStart(2, "0")}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/60 hover:text-white hover:bg-white/20 hover:border-white/25 transition-all duration-200"
              aria-label={lang === "es" ? "Cerrar" : "Close"}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path
                  d="M1 1L11 11M11 1L1 11"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Imagen — clic en márgenes (letterbox) cierra; clic en la imagen no */}
      <div
        className="relative z-10 flex h-full w-full items-center justify-center px-3 sm:px-6 md:px-14"
        style={{
          paddingTop: "72px",
          paddingBottom: hasMultiple ? "88px" : "40px",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div onClick={stop}>
          <LightboxImage
            src={currentSrc}
            closing={closing}
            label={label}
            title={title}
            index={index}
          />
        </div>
      </div>

      {/* Navegación */}
      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              prevImage();
            }}
            className="absolute left-1 md:left-5 top-1/2 -translate-y-1/2 z-20 h-12 w-9 md:h-14 md:w-14 flex items-center justify-center md:rounded-full bg-black/25 md:bg-white/8 backdrop-blur-sm md:border md:border-white/10 text-white/50 hover:text-white hover:bg-black/45 md:hover:bg-white/18 md:hover:border-white/30 transition-all duration-200"
            aria-label={lang === "es" ? "Anterior" : "Previous"}
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              nextImage();
            }}
            className="absolute right-1 md:right-5 top-1/2 -translate-y-1/2 z-20 h-12 w-9 md:h-14 md:w-14 flex items-center justify-center md:rounded-full bg-black/25 md:bg-white/8 backdrop-blur-sm md:border md:border-white/10 text-white/50 hover:text-white hover:bg-black/45 md:hover:bg-white/18 md:hover:border-white/30 transition-all duration-200"
            aria-label={lang === "es" ? "Siguiente" : "Next"}
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
          </button>
        </>
      )}

      {/* Tira de miniaturas */}
      {hasMultiple && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="pt-6 pb-5 bg-gradient-to-t from-black/95 via-black/65 to-transparent">
            <div
              className="flex justify-center gap-1.5 overflow-x-auto px-4 image-lightbox__thumbs"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {images.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={(e) => {
                    stop(e);
                    goTo(i);
                  }}
                  aria-label={`${lang === "es" ? "Imagen" : "Image"} ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                  className={`flex-none overflow-hidden rounded-md transition-all duration-200 ${
                    i === index
                      ? "ring-2 ring-white/80 opacity-100 scale-[1.08]"
                      : "ring-1 ring-white/10 opacity-35 hover:opacity-65 hover:ring-white/30 hover:scale-[1.04]"
                  }`}
                  style={{ width: "56px", height: "38px" }}
                >
                  <img src={thumbSrc(src)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
