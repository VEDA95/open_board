import { useState } from 'react';
import { useCard, useCardMutations } from '@lib/hooks/use-card';
import { profileLabel } from '@lib/utils/format-date';
import { LabelPicker } from '@components/card/label-picker';
import { AssigneePicker } from '@components/card/assignee-picker';
import { DueDatePicker } from '@components/card/due-date-picker';
import { Checklist } from '@components/card/checklist';
import { ActivityFeed } from '@components/card/activity-feed';
import { CommentsSection } from '@components/card/comments-section';
import { AttachmentList } from '@components/card/attachment-list';
import { AttachmentUpload } from '@components/card/attachment-upload';
import { Textarea } from '@components/ui/textarea';
import { Skeleton } from '@components/ui/skeleton';
import type { FC, ReactElement } from 'react';
import type { CardDetail } from '@lib/server-functions/cards';

type CardModalProps = {
  cardId: string;
  boardId: string;
  currentUserId: string | null;
};

function Section({ title, children }: { title: string; children: React.ReactNode }): ReactElement<FC> {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{title}</h3>
      {children}
    </section>
  );
}

function CardModalContent({ cardId, boardId, currentUserId, detail }: CardModalProps & { detail: CardDetail }): ReactElement<FC> {
  const { card, labels, checklistItems, activities, comments, attachments, assignee } = detail;
  const mutations = useCardMutations(cardId, boardId);
  const [description, setDescription] = useState(card.description ?? '');
  const assignedLabelIds = labels.map((label): string => label.id);

  const saveDescription = (): void => {
    const next = description.trim() === '' ? null : description;

    if (next === card.description) return;

    mutations.updateDetails.mutate({
      data: {
        cardId,
        description: next,
        color: card.color,
        dueDate: card.due_date,
        reminderDate: card.reminder_date
      }
    });
  };

  const setDueDate = (dueDate: string | null): void => {
    mutations.updateDetails.mutate({
      data: {
        cardId,
        description: card.description,
        color: card.color,
        dueDate,
        reminderDate: card.reminder_date
      }
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold">{card.name}</h2>
      </div>

      <div className="flex flex-wrap gap-2">
        <LabelPicker
          boardId={boardId}
          assignedLabelIds={assignedLabelIds}
          disabled={mutations.isSavingLabel}
          onToggle={(labelId: string, isAssigned: boolean): void => {
            if (isAssigned) mutations.removeLabel(labelId);
            else mutations.addLabel(labelId);
          }}
        />
        <AssigneePicker
          assignee={card.assignee}
          assigneeName={profileLabel(assignee)}
          disabled={mutations.setAssignee.isPending}
          onChange={(next: string | null): void => {
            mutations.setAssignee.mutate({ data: { cardId, assignee: next } });
          }}
        />
        <DueDatePicker
          dueDate={card.due_date}
          disabled={mutations.updateDetails.isPending}
          onChange={setDueDate}
        />
      </div>

      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {labels.map((label): ReactElement<FC> => (
            <button
              key={label.id}
              type="button"
              className="text-primary-foreground rounded px-2 py-0.5 text-xs"
              style={{ backgroundColor: label.color ?? '#64748b' }}
              onClick={(): void => mutations.removeLabel(label.id)}
              title="Click to remove"
            >
              {label.name}
            </button>
          ))}
        </div>
      )}

      <Section title="Description">
        <Textarea
          value={description}
          placeholder="Add a more detailed description…"
          onChange={(e): void => setDescription(e.target.value)}
          onBlur={saveDescription}
          className="min-h-24"
        />
      </Section>

      <Section title="Checklist">
        <Checklist
          items={checklistItems}
          disabled={mutations.isSavingChecklist}
          onAdd={mutations.addChecklistItem}
          onToggle={mutations.toggleChecklistItem}
          onDelete={mutations.deleteChecklistItem}
        />
      </Section>

      <Section title="Attachments">
        <AttachmentUpload uploading={mutations.isUploading} onUpload={mutations.uploadAttachment} />
        <AttachmentList
          attachments={attachments}
          disabled={mutations.isUploading}
          onDelete={mutations.deleteAttachment}
        />
      </Section>

      <Section title="Comments">
        <CommentsSection
          comments={comments}
          currentUserId={currentUserId}
          disabled={mutations.isSavingComment}
          uploading={mutations.isUploading}
          onAdd={mutations.addComment}
          onDelete={mutations.deleteComment}
          onUploadAttachment={mutations.uploadCommentAttachment}
          onDeleteAttachment={mutations.deleteCommentAttachment}
        />
      </Section>

      <Section title="Activity">
        <ActivityFeed activities={activities} />
      </Section>
    </div>
  );
}

export function CardModal({ cardId, boardId, currentUserId }: CardModalProps): ReactElement<FC> {
  const cardQuery = useCard(cardId);

  if (cardQuery.isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!cardQuery.isSuccess) {
    return <p className="text-muted-foreground text-sm">This card could not be loaded.</p>;
  }

  return (
    <CardModalContent
      cardId={cardId}
      boardId={boardId}
      currentUserId={currentUserId}
      detail={cardQuery.data}
    />
  );
}
