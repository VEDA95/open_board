import type { ReactNode } from 'react';

export type ResolvedTheme = 'dark' | 'light';
export type Theme = ResolvedTheme | 'system';
export type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
};
export type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
};
