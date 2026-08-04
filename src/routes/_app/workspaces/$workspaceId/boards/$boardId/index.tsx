import { createFileRoute } from '@tanstack/react-router';

// The board itself renders in the parent layout route; this default child is
// empty. The card modal lives at ./cards/$cardId.
export const Route = createFileRoute('/_app/workspaces/$workspaceId/boards/$boardId/')({
  component: () => null
});
