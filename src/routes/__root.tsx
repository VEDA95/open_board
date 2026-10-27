import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { ThemeProvider } from '@components/theme-provider';
import { getUserFunc } from '@lib/server-functions/auth';
import { SSR_FAVICON_THEME, getFaviconHeadLinks } from '@lib/utils/favicon';
import type { QueryClient } from '@tanstack/react-query';
import type { AuthState } from '@lib/types/auth';
import '@/styles.css';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient; }>()({
  beforeLoad: async (): Promise<AuthState> => await getUserFunc(),
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      ...getFaviconHeadLinks(SSR_FAVICON_THEME),
      {
        rel: 'manifest',
        href: '/site.webmanifest'
      }
    ]
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider defaultTheme="system" storageKey="theme">
          {children}
        </ThemeProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            {
              name: 'Tanstack Query',
              render: <ReactQueryDevtoolsPanel style={{ height: '100%' }} />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
