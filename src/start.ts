import { createStart } from '@tanstack/react-start';
import { clientIdMiddleware } from '@lib/middleware/client-id';

// TanStack Start picks this file up automatically as the "start entry" (the
// plugin resolves src/start.ts and expects a `startInstance` export).
// functionMiddleware applies to every server function in the app.
export const startInstance = createStart(() => ({
  functionMiddleware: [clientIdMiddleware],
}));
