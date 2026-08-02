import { HugeiconsIcon } from '@hugeicons/react';
import { DragDropVerticalIcon, MoreHorizontalIcon } from '@hugeicons/core-free-icons';
import {
  KanbanColumn,
  KanbanColumnContent,
  KanbanColumnHandle,
} from '@components/reui/kanban';
import { CardItem } from '@components/board/card-item';
import { AddCard } from '@components/board/add-card';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader } from '@components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import type { FC, ReactElement } from 'react';
import type { List } from '@lib/server-functions/lists';
import type { Card as CardType } from '@lib/server-functions/cards';

type ListColumnProps = {
  list: List;
  cards: Array<CardType>;
  addCardPending?: boolean;
  onAddCard: (listId: string, name: string) => void;
  onRenameList: (list: List) => void;
  onDeleteList: (list: List) => void;
  onRenameCard: (card: CardType) => void;
  onArchiveCard: (card: CardType) => void;
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
    <KanbanColumn value={list.id} className="w-80 shrink-0">
      <Card className="bg-muted/40 gap-0 py-0">
        <CardHeader className="flex flex-row items-center justify-between gap-2 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-semibold">{list.name}</span>
            <Badge variant="outline">{cards.length}</Badge>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <KanbanColumnHandle
              render={(
                <Button variant="ghost" size="icon-xs" className="text-muted-foreground cursor-grab" />
              )}
            >
              <HugeiconsIcon icon={DragDropVerticalIcon} strokeWidth={2} />
            </KanbanColumnHandle>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" />}>
                <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(): void => onRenameList(list)}>
                  Rename list
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(): void => onDeleteList(list)}
                >
                  Delete list
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 px-2 pt-0 pb-2">
          <KanbanColumnContent value={list.id} className="flex flex-col gap-2">
            {cards.map((card): ReactElement<FC> => (
              <CardItem
                key={card.id}
                card={card}
                onRename={onRenameCard}
                onArchive={onArchiveCard}
              />
            ))}
          </KanbanColumnContent>
          <AddCard
            listId={list.id}
            pending={addCardPending}
            onAdd={(name: string): void => onAddCard(list.id, name)}
          />
        </CardContent>
      </Card>
    </KanbanColumn>
  );
}
