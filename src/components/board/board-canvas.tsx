import { useEffect, useMemo, useState } from 'react';
import { Kanban, KanbanBoard, KanbanOverlay } from '@components/reui/kanban';
import { ListColumn } from '@components/board/list-column';
import { AddList } from '@components/board/add-list';
import { RenameDialog } from '@components/board/rename-dialog';
import { ConfirmDialog } from '@components/layout/confirm-dialog';
import { useBoardMutations } from '@lib/hooks/use-board';
import { positionBetween } from '@lib/utils/position';
import type { FC, ReactElement, ReactNode } from 'react';
import type { KanbanCommitMeta } from '@components/reui/kanban';
import type { List } from '@lib/server-functions/lists';
import type { BoardCard } from '@lib/server-functions/boards';

type BoardCanvasProps = {
  workspaceId: string;
  boardId: string;
  lists: Array<List>;
  cards: Array<BoardCard>;
};

type Columns = Record<string, Array<BoardCard>>;

function buildColumns(lists: Array<List>, cards: Array<BoardCard>): Columns {
  const columns: Columns = {};

  for (const list of lists) {
    columns[list.id] = [];
  }

  for (const card of cards) {
    if (card.list in columns) columns[card.list].push(card);
  }

  for (const listId of Object.keys(columns)) {
    columns[listId].sort(
      (a, b): number => (a.position ?? Infinity) - (b.position ?? Infinity)
    );
  }

  return columns;
}

// Arrangement (list order + card order per list) plus content that shows on a
// card. Used to decide whether incoming server data actually differs from what
// is on screen — a matching refetch (e.g. our own persisted move) is skipped so
// the board never re-renders mid-interaction and flickers.
function signature(columns: Columns): string {
  return Object.entries(columns)
    .map(([listId, cards]): string =>
      `${listId}:${cards
        .map((card): string =>
          [
            card.id,
            card.name,
            card.is_active,
            card.due_date,
            card.assignee,
            card.labels.map((label): string => label.id).join('+')
          ].join('~')
        )
        .join(',')}`
    )
    .join('|');
}

export function BoardCanvas({ workspaceId, boardId, lists, cards }: BoardCanvasProps): ReactElement<FC> {
  const mutations = useBoardMutations(boardId);
  const serverColumns = useMemo((): Columns => buildColumns(lists, cards), [lists, cards]);
  const serverSignature = useMemo((): string => signature(serverColumns), [serverColumns]);
  // Single source of truth for what the board shows. reUI drives this directly
  // during a drag via onValueChange; our own move persists optimistically so
  // the server data lands back identical and the reconcile below is a no-op.
  const [columns, setColumns] = useState<Columns>(serverColumns);
  const listsById = useMemo(() => new Map(lists.map((list) => [list.id, list])), [lists]);
  const [renameList, setRenameList] = useState<List | null>(null);
  const [deleteList, setDeleteList] = useState<List | null>(null);
  const [renameCard, setRenameCard] = useState<BoardCard | null>(null);
  const [dragging, setDragging] = useState(false);
  // Replacing `columns` while dnd-kit is mid-drag (or while our own move is
  // still persisting) desyncs it from the arrangement its handlers computed
  // against, so the next dragOver resolves the dragged card to a container it
  // no longer sits in. Any refetch can trigger this — a realtime echo, a window
  // refocus — so hold the reconcile until the interaction has fully settled.
  const interacting = dragging || mutations.isMovePending;

  // Adopt server data only when it genuinely differs from what's displayed.
  // This is what makes drops flicker-free: after a move the optimistic cache
  // matches the on-screen arrangement, so the signatures match and no rerender
  // is forced; external changes (create/rename/delete/archive) differ and apply.
  useEffect((): void => {
    if (interacting) return;

    setColumns((current): Columns =>
      signature(current) === serverSignature ? current : serverColumns
    );
  }, [serverSignature, serverColumns, interacting]);

  const handleCommit = (value: Columns, meta: KanbanCommitMeta<BoardCard>): void => {
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
        onValueChange={setColumns}
        getItemValue={(card: BoardCard): string => card.id}
        onValueCommit={handleCommit}
        onDragStart={(): void => setDragging(true)}
        onDragEnd={(): void => setDragging(false)}
        onDragCancel={(): void => setDragging(false)}
        className="h-full"
      >
        <KanbanBoard className="flex items-start gap-4 sm:grid-cols-none">
          {Object.keys(columns).map((listId): ReactNode => {
            const list = listsById.get(listId);

            if (list == null) return null;

            return (
              <ListColumn
                key={listId}
                workspaceId={workspaceId}
                boardId={boardId}
                list={list}
                cards={columns[listId]}
                addCardPending={mutations.createCard.isPending}
                onAddCard={(targetListId: string, name: string): void => {
                  mutations.createCard.mutate({ data: { listId: targetListId, name } });
                }}
                onRenameList={setRenameList}
                onDeleteList={setDeleteList}
                onRenameCard={setRenameCard}
                onArchiveCard={(card: BoardCard): void => {
                  mutations.setCardActive.mutate({ data: { cardId: card.id, isActive: false } });
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
        {/* Dashed placeholder that follows the cursor, matching the reUI
            example — the real item stays in place at reduced opacity. */}
        <KanbanOverlay className="bg-muted/20 rounded-xl border-2 border-dashed" />
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
