import type { ResolvedTheme } from '@lib/types/theme';

type FaviconDescriptor = {
  id: string
  rel: string
  type?: string
  sizes?: string
  file: string
};

/**
 * Single source of truth for the icon set. `public/favicon/{light,dark}/` both
 * hold the same filenames, so one descriptor list serves either theme — `head()`
 * renders it for SSR and `applyFavicon` re-points the same elements by `id`.
 */
const FAVICON_DESCRIPTORS: Array<FaviconDescriptor> = [
  {
    id: 'openboard-favicon',
    rel: 'icon',
    type: 'image/x-icon',
    sizes: '32x32 16x16',
    file: 'favicon.ico',
  },
  {
    id: 'openboard-png-favicon-16',
    rel: 'icon',
    type: 'image/png',
    sizes: '16x16',
    file: 'favicon-16x16.png',
  },
  {
    id: 'openboard-png-favicon-32',
    rel: 'icon',
    type: 'image/png',
    sizes: '32x32',
    file: 'favicon-32x32.png',
  },
  {
    id: 'openboard-android-favicon-192',
    rel: 'icon',
    type: 'image/png',
    sizes: '192x192',
    file: 'android-chrome-192x192.png',
  },
  {
    id: 'openboard-android-favicon-512',
    rel: 'icon',
    type: 'image/png',
    sizes: '512x512',
    file: 'android-chrome-512x512.png',
  },
  {
    id: 'openboard-apple-touch-favicon',
    rel: 'apple-touch-icon',
    sizes: '180x180',
    file: 'apple-touch-icon.png',
  },
];

/**
 * The theme the server renders icons for. The real theme only exists in
 * `localStorage`/`prefers-color-scheme`, so SSR picks this and `useFavicon`
 * corrects it on the client.
 */
export const SSR_FAVICON_THEME: ResolvedTheme = 'light';

/**
 * The icon directories are named for the *artwork* they hold, not the theme that
 * uses it. Each icon bakes in its own opaque tile, so `favicon/light/` is the
 * light-tiled icon — the one that stands out against dark browser chrome. The
 * mapping is therefore inverted on purpose, matching how `app-sidebar.tsx`
 * renders `openboard_logo.webp` under `dark:` and the `_dark` variant under light.
 */
function getIconVariant(theme: ResolvedTheme): ResolvedTheme {
  return theme === 'dark' ? 'light' : 'dark';
}

/**
 * Leading slash matters: a relative favicon href resolves against the current
 * URL, so on `/boards/:id/cards/:id` it would 404.
 */
function getFaviconHref(file: string, theme: ResolvedTheme): string {
  return `/favicon/${getIconVariant(theme)}/${file}`;
}

/** Link descriptors for a route's `head()`. */
export function getFaviconHeadLinks(theme: ResolvedTheme): Array<Omit<FaviconDescriptor, 'file'> & { href: string; }> {
  return FAVICON_DESCRIPTORS.map(({ file, ...link }): Omit<FaviconDescriptor, 'file'> & { href: string; } => ({
    ...link,
    href: getFaviconHref(file, theme),
  }));
}

/**
 * Re-points the already-rendered icon links at the other theme's files.
 * Mutating `href` (rather than swapping the nodes) keeps React's hydrated DOM
 * intact — the links come from a static `head()`, so React never writes over it.
 */
export function applyFavicon(theme: ResolvedTheme): void {
  for (const { id, file } of FAVICON_DESCRIPTORS) {
    const link = document.getElementById(id);

    if (link instanceof HTMLLinkElement) link.href = getFaviconHref(file, theme);
  }
}
