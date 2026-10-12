import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { routeTree } from './routeTree.gen';

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Freshness comes from realtime broadcasts and explicit invalidation,
        // not from polling. With the default staleTime of 0 every query also
        // refetches on remount and on window refocus, which fans a single tab
        // switch out into one request per mounted query.
        staleTime: 30_000,
      },
    },
  });
  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: 'intent',
    // defaultPreloadStaleTime is intentionally left at its 30s default. Setting
    // it to 0 makes every hover-intent preload re-run the matched route's
    // loaders *and* the root beforeLoad, and that beforeLoad calls getUserFunc
    // unconditionally — so merely sweeping the cursor over a list of links
    // fired an auth request per link.
  });

  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
