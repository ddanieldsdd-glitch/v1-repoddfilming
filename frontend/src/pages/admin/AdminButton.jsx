import { forwardRef } from "react";

export const AdminButton = forwardRef(function AdminButton(
  { variant = "secondary", children, className = "", ...props },
  ref,
) {
  const styles = {
    primary:
      "border border-white bg-white text-black hover:bg-transparent hover:text-white",
    secondary:
      "border border-white/30 text-white hover:bg-white hover:text-black",
    danger:
      "border border-red-400/60 text-red-300 hover:bg-red-400 hover:text-black",
    ghost: "border border-transparent text-neutral-400 hover:text-white",
  };
  return (
    <button
      ref={ref}
      type="button"
      className={`px-4 py-2 text-[10px] md:text-[11px] tracking-[0.22em] uppercase transition disabled:opacity-40 ${styles[variant] || styles.secondary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});
