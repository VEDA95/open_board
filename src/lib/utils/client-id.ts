// Identifies this browser tab so realtime broadcasts it caused can be ignored
// by it while still reaching every other client.
//
// Deliberately per-tab and in-memory rather than a cookie or localStorage: two
// tabs belonging to the same user are two independent clients and must still
// update each other, so the id cannot be shared across them. It also does not
// need to survive a reload — a reload remounts every query and refetches.
export const CLIENT_ID_HEADER = 'x-client-id';

let clientId: string | null = null;

// Browser-only. On the server the originating id arrives as a request header
// (see getSupabaseServerClient), so nothing server-side ever generates one —
// a module-scope id there would be shared by every concurrent request.
export function getClientId(): string {
  if (clientId == null) clientId = crypto.randomUUID();

  return clientId;
}
