import type { ResolvedTheme, Theme } from '@lib/types/theme';

export function getThemeScript(storageKey: string, defaultTheme: Theme) {
  const key = JSON.stringify(storageKey);
  const fallback = JSON.stringify(defaultTheme);

  return `(function(){try{var t=localStorage.getItem(${key});if(t!=='light'&&t!=='dark'&&t!=='system'){t=${fallback}}var d=matchMedia('(prefers-color-scheme: dark)').matches;var r=t==='system'?(d?'dark':'light'):t;var e=document.documentElement;e.classList.add(r);e.style.colorScheme=r}catch(e){}})();`;
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme !== 'system') return theme;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;

  root.classList.remove('light', 'dark');

  const resolved = resolveTheme(theme);

  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}
