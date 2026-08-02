import { HugeiconsIcon } from '@hugeicons/react';
import { MoreHorizontalIcon } from '@hugeicons/core-free-icons';
import { KanbanItem, KanbanItemHandle } from '@components/reui/kanban';
import { Card, CardContent } from '@components/ui/card';
import { Button } from '@components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import type { FC, ReactElement } from 'react';
import type { Card as CardType } from '@lib/server-functions/cards';

type CardItemProps = {
  card: CardType;
  onRename?: (card: CardType) => void;
  onArchive?: (card: CardType) => void;
};

export function CardItem({ card, onRename, onArchive }: CardItemProps): ReactElement<FC> {
  return (
    <KanbanItem value={card.id}>
      <KanbanItemHandle>
        <Card className="group/card relative py-0">
          <CardContent className="flex items-center justify-between gap-2 px-3 py-2.5">
            <span className="line-clamp-2 text-sm">{card.name}</span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={(
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="shrink-0 opacity-0 group-hover/card:opacity-100 data-[popup-open]:opacity-100"
                  />
                )}
              >
                <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(): void => onRename?.(card)}>
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(): void => onArchive?.(card)}>
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>
      </KanbanItemHandle>
    </KanbanItem>
  );
}
