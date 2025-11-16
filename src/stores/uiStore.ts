import { create } from 'zustand';

interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  activeModal: string | null;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'system',
  sidebarCollapsed: false,
  activeModal: null,
  setTheme: (theme) => {
    set({ theme });
    // Apply theme class to document
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(isDark ? 'dark' : 'light');
    } else {
      root.classList.add(theme);
    }
  },
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),
}));

