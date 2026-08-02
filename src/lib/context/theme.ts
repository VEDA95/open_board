import { createContext, useContext } from 'react';
import type { ThemeProviderState } from '@lib/types/theme';

const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: 'system',
  setTheme: (): void => {},
});

function useTheme(): ThemeProviderState {
  return useContext(ThemeProviderContext);
}

export { ThemeProviderContext, useTheme };
