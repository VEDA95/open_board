import { HugeiconsIcon } from '@hugeicons/react';
import { MoreHorizontalIcon } from '@hugeicons/core-free-icons';
import { KanbanItem, KanbanItemHandle } from '@components/reui/kanban';
import { Button } from '@components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import type { FC, ReactElement } from 'react';
import type { Card } from '@lib/server-functions/cards';

type CardItemProps = {
  card: Card;
  onRename?: (card: Card) => void;
  onArchive?: (card: Card) => void;
};

// Shared visual for both the sortable item and the drag overlay ghost.
export function CardItemContent({ card }: { card: Card }): ReactElement<FC> {
  return (
    <div className="bg-card text-card-foreground rounded-lg border p-3 text-sm shadow-xs">
      {card.name}
    </div>
  );
}

export function CardItem({ card, onRename, onArchive }: CardItemProps): ReactElement<FC> {
  return (
    <KanbanItem value={card.id} className="group/card relative">
      <KanbanItemHandle>
        <CardItemContent card={card} />
      </KanbanItemHandle>
      <div className="absolute top-1.5 right-1.5 opacity-0 transition-opacity group-hover/card:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-6" />}>
            <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={(): void => onRename?.(card)}>
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(): void => onArchive?.(card)}>
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </KanbanItem>
  );
}
