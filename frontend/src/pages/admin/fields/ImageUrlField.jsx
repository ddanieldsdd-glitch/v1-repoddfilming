import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadImageFile, cloudinaryFolderHint } from "../../../lib/uploadImage";
import { ImageDropZone } from "../../../components/admin/ImageDropZone";
import { Field } from "./Field";
import { inputCls, uploadBtnCls } from "../styles";
export const ImageUrlField = ({
  label,
  value,
  onChange,
  projectSlug,
  assetType,
  testId,
  placeholder = "https://res.cloudinary.com/...",
  previewFit = "cover",
  previewBg = "bg-neutral-800",
  onUploadStart,
}) => {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const canUpload = assetType === "site" || !!projectSlug;

  const handleUpload = async (files) => {
    const file = Array.isArray(files) ? files[0] : files?.[0];
    if (!file) return;
    if (!canUpload) {
      toast.error("Define el slug del proyecto antes de subir imágenes");
      return;
    }
    onUploadStart?.();
    setUploading(true);
    try {
      const url = await uploadImageFile(file, { projectSlug, assetType });
      onChange(url);
      toast.success("Imagen subida a Cloudinary");
    } catch (err) {
      toast.error(err.message || "Error al subir");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Field label={label}>
      <ImageDropZone
        onFiles={handleUpload}
        disabled={!canUpload}
        uploading={uploading}
        multiple={false}
        className="p-3"
      >
      <div className="flex gap-2 items-start">
        <input
          data-testid={testId}
          className={inputCls}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || !canUpload}
          className={uploadBtnCls + " self-stretch"}
          title={canUpload ? cloudinaryFolderHint(projectSlug, assetType) : "Define el slug primero"}
        >
          {uploading ? "Subiendo…" : "Subir"}
        </button>
      </div>
      {assetType !== "site" && (
        <p className="text-[9px] text-neutral-700 mt-1.5 font-mono">
          Cloudinary → {cloudinaryFolderHint(projectSlug, assetType)}
        </p>
      )}
      {value && (
        <div className={`mt-2 w-full max-w-[200px] aspect-video ${previewBg} rounded overflow-hidden border border-white/10`}>
          <img
            src={value}
            alt=""
            className={`w-full h-full ${previewFit === "contain" ? "object-contain p-1" : "object-cover"}`}
            onError={(e) => { e.target.style.display = "none"; }}
          />
        </div>
      )}
      </ImageDropZone>
    </Field>
  );
};
