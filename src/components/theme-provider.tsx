import { useEffect, useState } from 'react';
import { ScriptOnce } from '@tanstack/react-router';
import {ThemeProviderContext} from '@lib/context/theme';
import {applyTheme, getThemeScript} from '@lib/utils/theme';
import type {FC, ReactElement} from 'react';
import type {Theme, ThemeProviderProps} from '@lib/types/theme';

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
}: ThemeProviderProps): ReactElement<FC> {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);
 
  useEffect((): void => {
    const stored = localStorage.getItem(storageKey);
    setThemeState(
      stored === 'light' || stored === 'dark' || stored === 'system'
        ? stored
        : defaultTheme
    );
    setMounted(true);
  }, [defaultTheme, storageKey]);
 
  useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
  }, [theme, mounted]);
 
  useEffect(() => {
    if (!mounted || theme !== 'system') return;
 
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme, mounted]);
 
  const setTheme = (next: Theme) => {
    localStorage.setItem(storageKey, next);
    setThemeState(next);
  };

  return (
    <ThemeProviderContext value={{ theme, setTheme }}>
      <ScriptOnce>{getThemeScript(storageKey, defaultTheme)}</ScriptOnce>
      {children}
    </ThemeProviderContext>
  );
}
