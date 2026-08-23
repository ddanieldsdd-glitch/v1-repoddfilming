import { cropImageStyle, normalizeCrop } from "../lib/crop";

export function CroppedImage({
  src,
  srcSet,
  sizes,
  alt = "",
  crop,
  className = "",
  imgClassName = "",
  loading,
  decoding,
  fetchPriority,
  width,
  height,
}) {
  const style = cropImageStyle(crop);
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        width={width}
        height={height}
        className={`max-w-none ${imgClassName}`}
        style={style}
      />
    </div>
  );
}

export function isFullCrop(crop) {
  const c = normalizeCrop(crop);
  return c.w >= 0.99 && c.h >= 0.99 && c.x <= 0.01 && c.y <= 0.01;
}
