import { mergeRecognitionUrls, normalizeRecognitions } from "../../../lib/recognitions";
import { MediaUrlList } from "../MediaUrlList";

export const RecognitionsField = ({ items, onChange, projectSlug, onUploadStart }) => {
  const list = normalizeRecognitions(items);
  return (
    <MediaUrlList
      label="Reconocimientos / premios"
      items={list}
      onChange={onChange}
      getUrl={(item) => item.url}
      mapUrl={(url) => mergeRecognitionUrls([], [url])[0]}
      projectSlug={projectSlug}
      assetType="recognitions"
      onUploadStart={onUploadStart}
      previewFit="contain"
      previewBg="bg-black"
      renderExtras={(item, i) => (
        <div className="flex items-center gap-2">
          {["showOnHome", "showOnWork"].map((key) => (
            <label key={key} className="flex items-center gap-1 text-[9px] uppercase tracking-[0.1em] text-neutral-500">
              <input
                type="checkbox"
                checked={item[key]}
                className="accent-white"
                onChange={() =>
                  onChange(list.map((entry, idx) => (idx === i ? { ...entry, [key]: !entry[key] } : entry)))
                }
              />
              {key === "showOnHome" ? "Home" : "Work"}
            </label>
          ))}
        </div>
      )}
    />
  );
};
