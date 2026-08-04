import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { cardQueryOptions } from '@lib/hooks/use-card';
import { CardModal } from '@components/card/card-modal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import type { FC, ReactElement } from 'react';

function CardModalRoute(): ReactElement<FC> {
  const { workspaceId, boardId, cardId } = Route.useParams();
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();

  const close = (): void => {
    navigate({
      to: '/workspaces/$workspaceId/boards/$boardId',
      params: { workspaceId, boardId }
    });
  };

  return (
    <Dialog
      open
      onOpenChange={(open: boolean): void => {
        if (!open) close();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Card details</DialogTitle>
        </DialogHeader>
        <CardModal cardId={cardId} boardId={boardId} currentUserId={user?.id ?? null} />
      </DialogContent>
    </Dialog>
  );
}

export const Route = createFileRoute('/_app/workspaces/$workspaceId/boards/$boardId/cards/$cardId')({
  loader: async ({ context, params }): Promise<void> => {
    await context.queryClient.ensureQueryData(cardQueryOptions(params.cardId));
  },
  component: CardModalRoute
});
