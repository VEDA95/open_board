import { createMiddleware } from '@tanstack/react-start';
import { CLIENT_ID_HEADER, getClientId } from '@lib/utils/client-id';

// Stamps every server-function call with the calling tab's id. Registered
// globally in src/start.ts, so no individual server function or call site has
// to thread it through. getSupabaseServerClient forwards the header on to
// PostgREST, where the broadcast trigger reads it back out.
//
// Only the `client` half is needed: during SSR server functions are invoked
// directly rather than over HTTP, and those are reads that never broadcast.
export const clientIdMiddleware = createMiddleware({ type: 'function' }).client(({ next }) =>
  next({ headers: { [CLIENT_ID_HEADER]: getClientId() } })
);
