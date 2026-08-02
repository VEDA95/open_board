import { HugeiconsIcon } from '@hugeicons/react';
import { MoreHorizontalIcon } from '@hugeicons/core-free-icons';
import {
  KanbanColumn,
  KanbanColumnContent,
  KanbanColumnHandle,
} from '@components/reui/kanban';
import { CardItem } from '@components/board/card-item';
import { AddCard } from '@components/board/add-card';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import type { FC, ReactElement } from 'react';
import type { List } from '@lib/server-functions/lists';
import type { Card } from '@lib/server-functions/cards';

type ListColumnProps = {
  list: List;
  cards: Array<Card>;
  addCardPending?: boolean;
  onAddCard: (listId: string, name: string) => void;
  onRenameList: (list: List) => void;
  onDeleteList: (list: List) => void;
  onRenameCard: (card: Card) => void;
  onArchiveCard: (card: Card) => void;
};

export function ListColumn({
  list,
  cards,
  addCardPending = false,
  onAddCard,
  onRenameList,
  onDeleteList,
  onRenameCard,
  onArchiveCard,
}: ListColumnProps): ReactElement<FC> {
  return (
    <KanbanColumn value={list.id} className="bg-muted/50 w-72 shrink-0 rounded-xl border">
      <KanbanColumnHandle>
        <div className="flex items-center justify-between gap-2 p-2 pb-0">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-sm font-medium">{list.name}</h3>
            <Badge variant="outline">{cards.length}</Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-7" />}>
              <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={(): void => onRenameList(list)}>
                Rename list
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={(): void => onDeleteList(list)}
              >
                Delete list
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </KanbanColumnHandle>
      <KanbanColumnContent value={list.id} className="min-h-8 flex-1 p-2">
        {cards.map((card): ReactElement<FC> => (
          <CardItem
            key={card.id}
            card={card}
            onRename={onRenameCard}
            onArchive={onArchiveCard}
          />
        ))}
      </KanbanColumnContent>
      <div className="p-2 pt-0">
        <AddCard
          listId={list.id}
          pending={addCardPending}
          onAdd={(name: string): void => onAddCard(list.id, name)}
        />
      </div>
    </KanbanColumn>
  );
}
