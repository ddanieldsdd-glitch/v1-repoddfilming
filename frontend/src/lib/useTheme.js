import { useEffect } from "react";

// Always apply dark mode on module load
if (typeof document !== "undefined") {
  document.documentElement.classList.add("dark");
  document.documentElement.style.colorScheme = "dark";
}

export const useTheme = () => {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }, []);

  // Return dummy setter so consuming components don't break
  const noop = () => {};
  return ["dark", noop];
};