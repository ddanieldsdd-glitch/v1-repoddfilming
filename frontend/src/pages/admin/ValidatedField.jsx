import { Field, inputCls, textareaCls } from "./fields/Field";

export const ValidatedField = ({
  label,
  error,
  hint,
  counter,
  children,
}) => (
  <Field label={label}>
    {children}
    {hint && !error && <p className="mt-1 text-[11px] text-neutral-500">{hint}</p>}
    {typeof counter === "number" && (
      <p className={`mt-1 text-[9px] ${counter > 320 ? "text-amber-400" : "text-neutral-600"}`}>
        {counter} caracteres
      </p>
    )}
    {error && <p className="mt-1 text-[11px] text-amber-400">{error}</p>}
  </Field>
);

export const I18nField = ({
  label,
  es,
  en,
  onChangeEs,
  onChangeEn,
  multiline = false,
  error,
}) => {
  const Control = multiline ? "textarea" : "input";
  const cls = multiline ? textareaCls + " min-h-[120px]" : inputCls;
  return (
    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
      <ValidatedField label={`${label} ES`} error={error}>
        <Control className={cls} value={es || ""} onChange={(e) => onChangeEs(e.target.value)} />
      </ValidatedField>
      <ValidatedField label={`${label} EN`}>
        <Control className={cls} value={en || ""} onChange={(e) => onChangeEn(e.target.value)} />
      </ValidatedField>
    </div>
  );
};

export { inputCls, textareaCls };
