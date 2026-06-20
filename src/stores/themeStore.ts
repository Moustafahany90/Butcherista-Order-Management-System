import { create } from "zustand";

interface ThemeState {
  dark: boolean;
  toggleDark: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  dark: localStorage.getItem("butcherista-theme") === "dark",
  toggleDark: () =>
    set((state) => {
      const next = !state.dark;
      localStorage.setItem("butcherista-theme", next ? "dark" : "light");
      document.documentElement.classList.toggle("dark", next);
      return { dark: next };
    }),
}));
