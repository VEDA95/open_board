import { Link } from '@tanstack/react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar03Icon, MoreHorizontalIcon } from '@hugeicons/core-free-icons';
import { KanbanItem, KanbanItemHandle } from '@components/reui/kanban';
import { Avatar, AvatarFallback } from '@components/ui/avatar';
import { Card, CardContent } from '@components/ui/card';
import { Button } from '@components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { cn } from '@lib/utils/cn';
import { formatDate, isOverdue, profileLabel } from '@lib/utils/format-date';
import type { FC, ReactElement } from 'react';
import type { BoardCard } from '@lib/server-functions/boards';

type CardItemProps = {
  workspaceId: string;
  boardId: string;
  card: BoardCard;
  onRename?: (card: BoardCard) => void;
  onArchive?: (card: BoardCard) => void;
};

export function CardItem({ workspaceId, boardId, card, onRename, onArchive }: CardItemProps): ReactElement<FC> {
  const assigneeName = profileLabel(card.assigneeProfile);

  return (
    <KanbanItem value={card.id}>
      <KanbanItemHandle>
        <Card className="group/card relative py-0">
          <Link
            to="/workspaces/$workspaceId/boards/$boardId/cards/$cardId"
            params={{ workspaceId, boardId, cardId: card.id }}
            className="block"
          >
            <CardContent className="flex flex-col gap-2 px-3 py-2.5">
              {card.labels.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {card.labels.map((label): ReactElement<FC> => (
                    <span
                      key={label.id}
                      className="h-1.5 w-8 rounded-full"
                      style={{ backgroundColor: label.color ?? '#64748b' }}
                      title={label.name}
                    />
                  ))}
                </div>
              )}
              <span className="line-clamp-3 pr-6 text-sm">{card.name}</span>
              {(card.due_date != null || card.assigneeProfile != null) && (
                <div className="flex items-center justify-between gap-2">
                  {card.due_date != null
                    ? (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs',
                            isOverdue(card.due_date)
                              ? 'bg-destructive/15 text-destructive'
                              : 'text-muted-foreground'
                          )}
                        >
                          <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3" />
                          {formatDate(card.due_date)}
                        </span>
                      )
                    : <span />}
                  {card.assigneeProfile != null && (
                    <Avatar className="size-5">
                      <AvatarFallback className="text-[10px]">
                        {assigneeName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )}
            </CardContent>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={(
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="absolute top-1.5 right-1.5 opacity-0 group-hover/card:opacity-100 data-[popup-open]:opacity-100"
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
        </Card>
      </KanbanItemHandle>
    </KanbanItem>
  );
}
