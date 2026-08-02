import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Kanban, KanbanBoard, KanbanOverlay } from '@components/reui/kanban';
import { ListColumn } from '@components/board/list-column';
import { CardItemContent } from '@components/board/card-item';
import { AddList } from '@components/board/add-list';
import { RenameDialog } from '@components/board/rename-dialog';
import { ConfirmDialog } from '@components/layout/confirm-dialog';
import { useBoardMutations } from '@lib/hooks/use-board';
import { positionBetween } from '@lib/utils/position';
import type { FC, ReactElement, ReactNode } from 'react';
import type { UniqueIdentifier } from '@dnd-kit/core';
import type { KanbanCommitMeta } from '@components/reui/kanban';
import type { List } from '@lib/server-functions/lists';
import type { Card } from '@lib/server-functions/cards';

type BoardCanvasProps = {
  boardId: string;
  lists: Array<List>;
  cards: Array<Card>;
};

type Columns = Record<string, Array<Card>>;

function buildColumns(lists: Array<List>, cards: Array<Card>): Columns {
  const columns: Columns = {};

  for (const list of lists) {
    columns[list.id] = [];
  }

  for (const card of cards) {
    if (card.list in columns) columns[card.list].push(card);
  }

  return columns;
}

export function BoardCanvas({ boardId, lists, cards }: BoardCanvasProps): ReactElement<FC> {
  const mutations = useBoardMutations(boardId);
  const serverColumns = useMemo((): Columns => buildColumns(lists, cards), [lists, cards]);
  // reUI's Kanban is controlled: it reorders `value` while a drag is in
  // flight. Interim states live here; once a drag commits, the optimistic
  // cache patch takes over and this resets to mirror the server data.
  const [dragColumns, setDragColumns] = useState<Columns | null>(null);
  const columns = dragColumns ?? serverColumns;
  const listsById = useMemo(() => new Map(lists.map((list) => [list.id, list])), [lists]);
  const cardsById = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);
  const [renameList, setRenameList] = useState<List | null>(null);
  const [deleteList, setDeleteList] = useState<List | null>(null);
  const [renameCard, setRenameCard] = useState<Card | null>(null);

  const handleCommit = (value: Columns, meta: KanbanCommitMeta<Card>): void => {
    setDragColumns(null);

    if (meta.kind === 'column') {
      const keys = Object.keys(value);
      const index = keys.indexOf(meta.activeContainer);

      if (index === -1) return;

      const prev = index > 0 ? listsById.get(keys[index - 1])?.position : null;
      const next = index < keys.length - 1 ? listsById.get(keys[index + 1])?.position : null;

      mutations.moveList({
        listId: meta.activeContainer,
        position: positionBetween(prev, next)
      });
      return;
    }

    const activeId = String(meta.event.active.id);

    if (!(meta.overContainer in value)) return;

    const targetCards = value[meta.overContainer];

    const index = targetCards.findIndex((card): boolean => card.id === activeId);

    if (index === -1) return;

    const prev = index > 0 ? targetCards[index - 1].position : null;
    const next = index < targetCards.length - 1 ? targetCards[index + 1].position : null;

    mutations.moveCard({
      cardId: activeId,
      listId: meta.overContainer,
      position: positionBetween(prev, next)
    });
  };

  return (
    <div className="flex-1 overflow-x-auto p-4 md:p-6">
      <Kanban
        value={columns}
        onValueChange={setDragColumns}
        getItemValue={(card: Card): string => card.id}
        onValueCommit={handleCommit}
        onDragCancel={(): void => setDragColumns(null)}
        className="h-full"
      >
        <KanbanBoard className="flex h-full items-start gap-4 sm:grid-cols-none">
          {Object.keys(columns).map((listId): ReactNode => {
            const list = listsById.get(listId);

            if (list == null) return null;

            return (
              <ListColumn
                key={listId}
                list={list}
                cards={columns[listId]}
                addCardPending={mutations.createCard.isPending}
                onAddCard={(targetListId: string, name: string): void => {
                  mutations.createCard.mutate({ data: { listId: targetListId, name } });
                }}
                onRenameList={setRenameList}
                onDeleteList={setDeleteList}
                onRenameCard={setRenameCard}
                onArchiveCard={(card: Card): void => {
                  mutations.setCardActive.mutate(
                    { data: { cardId: card.id, isActive: false } },
                    { onSuccess: (): void => { toast.success('Card archived'); } }
                  );
                }}
              />
            );
          })}
          <AddList
            pending={mutations.createList.isPending}
            onAdd={(name: string): void => {
              mutations.createList.mutate({ data: { boardId, name } });
            }}
          />
        </KanbanBoard>
        <KanbanOverlay>
          {({ value, variant }: { value: UniqueIdentifier; variant: 'column' | 'item' }): ReactNode => {
            if (variant === 'item') {
              const card = cardsById.get(String(value));

              return card != null ? <CardItemContent card={card} /> : null;
            }

            const list = listsById.get(String(value));

            return list != null
              ? (
                  <div className="bg-muted/80 w-72 rounded-xl border p-2 text-sm font-medium">
                    {list.name}
                  </div>
                )
              : null;
          }}
        </KanbanOverlay>
      </Kanban>
      {renameList != null && (
        <RenameDialog
          open
          onOpenChange={(open: boolean): void => {
            if (!open) setRenameList(null);
          }}
          title="Rename list"
          initialValue={renameList.name}
          pending={mutations.renameList.isPending}
          onSubmit={(name: string): void => {
            mutations.renameList.mutate(
              { data: { listId: renameList.id, name } },
              { onSuccess: (): void => setRenameList(null) }
            );
          }}
        />
      )}
      {renameCard != null && (
        <RenameDialog
          open
          onOpenChange={(open: boolean): void => {
            if (!open) setRenameCard(null);
          }}
          title="Rename card"
          initialValue={renameCard.name}
          pending={mutations.renameCard.isPending}
          onSubmit={(name: string): void => {
            mutations.renameCard.mutate(
              { data: { cardId: renameCard.id, name } },
              { onSuccess: (): void => setRenameCard(null) }
            );
          }}
        />
      )}
      <ConfirmDialog
        open={deleteList != null}
        onOpenChange={(open: boolean): void => {
          if (!open) setDeleteList(null);
        }}
        title="Delete list?"
        description={`"${deleteList?.name ?? ''}" and all of its cards will be permanently deleted.`}
        pending={mutations.deleteList.isPending}
        onConfirm={(): void => {
          if (deleteList == null) return;

          mutations.deleteList.mutate(
            { data: { listId: deleteList.id } },
            { onSuccess: (): void => setDeleteList(null) }
          );
        }}
      />
    </div>
  );
}
