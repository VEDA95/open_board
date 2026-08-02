import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { archivedCardsQueryOptions, useBoardMutations } from '@lib/hooks/use-board';
import { Button } from '@components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@components/ui/sheet';
import { Skeleton } from '@components/ui/skeleton';
import type { FC, ReactElement } from 'react';

type ArchivedCardsSheetProps = {
  boardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ArchivedCardsSheet({ boardId, open, onOpenChange }: ArchivedCardsSheetProps): ReactElement<FC> {
  const archivedQuery = useQuery({
    ...archivedCardsQueryOptions(boardId),
    enabled: open
  });
  const mutations = useBoardMutations(boardId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Archived cards</SheetTitle>
          <SheetDescription>
            Restore archived cards to their list, or delete them permanently.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 overflow-y-auto p-4 pt-0">
          {archivedQuery.isPending && (
            <>
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </>
          )}
          {archivedQuery.isSuccess && archivedQuery.data.length === 0 && (
            <p className="text-muted-foreground text-sm">No archived cards.</p>
          )}
          {archivedQuery.isSuccess && archivedQuery.data.map((card): ReactElement<FC> => (
            <div key={card.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm">{card.name}</p>
                <p className="text-muted-foreground text-xs">in {card.lists.name}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={mutations.setCardActive.isPending}
                  onClick={(): void => {
                    mutations.setCardActive.mutate(
                      { data: { cardId: card.id, isActive: true } },
                      { onSuccess: (): void => { toast.success('Card restored'); } }
                    );
                  }}
                >
                  Restore
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={mutations.deleteCard.isPending}
                  onClick={(): void => {
                    mutations.deleteCard.mutate(
                      { data: { cardId: card.id } },
                      { onSuccess: (): void => { toast.success('Card deleted'); } }
                    );
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
