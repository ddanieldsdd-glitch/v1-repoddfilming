import { useState, useCallback } from "react";

export function useImageLightbox() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [images, setImages] = useState([]);
  const [index, setIndex] = useState(0);
  const [label, setLabel] = useState("");
  const [title, setTitle] = useState("");

  const openLightbox = useCallback(({ images: imgs, index: i = 0, label: lb = "", title: t = "" }) => {
    if (!imgs?.length) return;
    setImages(imgs);
    setIndex(i);
    setLabel(lb);
    setTitle(t);
    setClosing(false);
    setOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 260);
  }, []);

  return {
    open,
    closing,
    images,
    index,
    setIndex,
    label,
    title,
    openLightbox,
    closeLightbox,
  };
}
