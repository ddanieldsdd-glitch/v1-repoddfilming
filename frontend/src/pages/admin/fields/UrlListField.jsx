import { MediaUrlList } from "../MediaUrlList";

export const UrlListField = ({
  label,
  urls,
  onChange,
  projectSlug,
  assetType,
  onUploadStart,
  previewFit,
  previewBg,
}) => (
  <MediaUrlList
    label={label}
    items={urls || []}
    onChange={onChange}
    projectSlug={projectSlug}
    assetType={assetType}
    onUploadStart={onUploadStart}
    previewFit={previewFit}
    previewBg={previewBg}
  />
);
