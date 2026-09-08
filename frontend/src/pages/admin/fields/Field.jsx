import { uploadBtnCls, inputCls, textareaCls } from "../styles";

export const Field = ({ label, children }) => (
  <label className="block">
    <span className="block text-[10px] tracking-[0.28em] uppercase text-neutral-400 mb-2">
      {label}
    </span>
    {children}
  </label>
);

export { inputCls, textareaCls, uploadBtnCls };
