import { create } from "zustand";
import { persist } from "zustand/middleware";
import { THEME } from "@/constants";

type Theme = "light" | "dark";
type SidebarState = "expanded" | "collapsed";

interface UIState {
  theme: Theme;
  sidebar: SidebarState;
  activeModuleId: string | null;
  mobileMenuOpen: boolean;

  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSidebar: (state: SidebarState) => void;
  toggleSidebar: () => void;
  setActiveModule: (id: string | null) => void;
  setMobileMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: THEME.DEFAULT as Theme,
      sidebar: "expanded",
      activeModuleId: null,
      mobileMenuOpen: false,

      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
      setSidebar: (sidebar) => set({ sidebar }),
      toggleSidebar: () =>
        set((state) => ({
          sidebar: state.sidebar === "expanded" ? "collapsed" : "expanded",
        })),
      setActiveModule: (id) => set({ activeModuleId: id }),
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
    }),
    {
      name: THEME.STORAGE_KEY,
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);
