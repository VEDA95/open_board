import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon, File01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@components/ui/button';
import type { FC, ReactElement } from 'react';
import type { CardAttachment } from '@lib/server-functions/cards';

type AttachmentListProps = {
  attachments: Array<CardAttachment>;
  disabled?: boolean;
  onDelete: (file: string) => void;
};

function formatBytes(bytes: number | null): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentList({ attachments, disabled = false, onDelete }: AttachmentListProps): ReactElement<FC> {
  if (attachments.length === 0) {
    return <p className="text-muted-foreground text-sm">No attachments yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {attachments.map((attachment): ReactElement<FC> => (
        <li
          key={attachment.file}
          className="group/att flex items-center gap-2 rounded-lg border p-2"
        >
          <HugeiconsIcon icon={File01Icon} strokeWidth={2} className="text-muted-foreground size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            {attachment.url != null
              ? (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-sm hover:underline"
                  >
                    {attachment.name}
                  </a>
                )
              : <span className="block truncate text-sm">{attachment.name}</span>}
            <span className="text-muted-foreground text-xs">{formatBytes(attachment.size)}</span>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            className="opacity-0 group-hover/att:opacity-100"
            disabled={disabled}
            onClick={(): void => onDelete(attachment.file)}
          >
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
          </Button>
        </li>
      ))}
    </ul>
  );
}
