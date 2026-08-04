import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon } from '@hugeicons/core-free-icons';
import { formatDate, profileLabel } from '@lib/utils/format-date';
import { AttachmentList } from '@components/card/attachment-list';
import { AttachmentUpload } from '@components/card/attachment-upload';
import { Avatar, AvatarFallback } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import { Textarea } from '@components/ui/textarea';
import type { FC, ReactElement } from 'react';
import type { CommentWithAuthor } from '@lib/server-functions/cards';

type CommentsSectionProps = {
  comments: Array<CommentWithAuthor>;
  currentUserId: string | null;
  disabled?: boolean;
  uploading?: boolean;
  onAdd: (comment: string) => void;
  onDelete: (commentId: string) => void;
  onUploadAttachment: (commentId: string, file: File) => void;
  onDeleteAttachment: (commentId: string, file: string) => void;
};

export function CommentsSection({
  comments,
  currentUserId,
  disabled = false,
  uploading = false,
  onAdd,
  onDelete,
  onUploadAttachment,
  onDeleteAttachment,
}: CommentsSectionProps): ReactElement<FC> {
  const [draft, setDraft] = useState('');

  const submit = (): void => {
    const trimmed = draft.trim();

    if (trimmed === '') return;

    onAdd(trimmed);
    setDraft('');
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Textarea
          value={draft}
          placeholder="Write a comment…"
          className="min-h-16"
          onChange={(e): void => setDraft(e.target.value)}
        />
        <div>
          <Button size="sm" disabled={disabled || draft.trim() === ''} onClick={submit}>
            Comment
          </Button>
        </div>
      </div>
      {comments.length === 0
        ? <p className="text-muted-foreground text-sm">No comments yet.</p>
        : (
            <ul className="flex flex-col gap-3">
              {comments.map((comment): ReactElement<FC> => {
                const author = profileLabel(comment.author);

                return (
                  <li key={comment.id} className="group/comment flex gap-2">
                    <Avatar className="size-6 shrink-0">
                      <AvatarFallback className="text-[10px]">
                        {author.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{author}</span>
                        <span className="text-muted-foreground text-xs">
                          {formatDate(comment.created_at)}
                        </span>
                        {comment.user_id === currentUserId && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="ml-auto opacity-0 group-hover/comment:opacity-100"
                            disabled={disabled}
                            onClick={(): void => onDelete(comment.id)}
                          >
                            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                      {(comment.attachments.length > 0 || comment.user_id === currentUserId) && (
                        <div className="mt-2 flex flex-col gap-2">
                          {comment.attachments.length > 0 && (
                            <AttachmentList
                              attachments={comment.attachments}
                              disabled={disabled}
                              onDelete={(file: string): void => onDeleteAttachment(comment.id, file)}
                            />
                          )}
                          {comment.user_id === currentUserId && (
                            <div>
                              <AttachmentUpload
                                uploading={uploading}
                                onUpload={(file: File): void => onUploadAttachment(comment.id, file)}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
    </div>
  );
}
