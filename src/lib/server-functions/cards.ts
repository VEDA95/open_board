import { createServerFn } from '@tanstack/react-start';
import { setResponseStatus } from '@tanstack/react-start/server';
import { getSupabaseServerClient } from '@lib/utils/supabase';
import { requireBoardAccess, requireUser } from '@lib/utils/permissions';
import { INITIAL_SPACING, hasDegenerateGaps } from '@lib/utils/position';
import { logActivity } from '@lib/server-functions/activity';
import {
  cardIdValidator,
  createCardValidator,
  moveCardValidator,
  renameCardValidator,
  setCardActiveValidator,
  setCardAssigneeValidator,
  updateCardDetailsValidator
} from '@lib/validators/card';
import { getSupabaseAdminClient } from '@lib/utils/supabase-admin';
import { boardIdValidator } from '@lib/validators/board';
import type { Tables } from '@lib/types/supabase';
import type { Label } from '@lib/server-functions/labels';
import type { ChecklistItem } from '@lib/server-functions/checklists';
import type { Comment } from '@lib/server-functions/comments';

export type Card = Tables<'cards'>;
export type Profile = Tables<'profiles'>;
export type CardActivity = Tables<'card_activities'>;
export type CardActivityWithAuthor = CardActivity & { author: Profile | null };
export type CardAttachment = {
  file: string;
  name: string;
  size: number | null;
  mimeType: string | null;
  url: string | null;
};
export type CommentWithAuthor = Comment & {
  author: Profile | null;
  attachments: Array<CardAttachment>;
};

const COMMENT_ATTACHMENTS_BUCKET = 'comment_attachments';
export type CardDetail = {
  card: Card;
  labels: Array<Label>;
  checklistItems: Array<ChecklistItem>;
  activities: Array<CardActivityWithAuthor>;
  comments: Array<CommentWithAuthor>;
  attachments: Array<CardAttachment>;
  assignee: Profile | null;
};

const ATTACHMENTS_BUCKET = 'card_attachments';
const SIGNED_URL_TTL_SECONDS = 3600;

export const createCardFunc = createServerFn({ method: 'POST' })
  .inputValidator(createCardValidator)
  .handler(async ({ data }): Promise<Card> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: last } = await supabase
      .from('cards')
      .select('position')
      .eq('list', data.listId)
      .eq('is_active', true)
      .order('position', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    const { data: card, error } = await supabase
      .from('cards')
      .insert({
        name: data.name,
        list: data.listId,
        position: (last?.position ?? 0) + INITIAL_SPACING
      })
      .select()
      .single();

    if (error != null) {
      setResponseStatus(403);
      throw error;
    }

    return card;
  });

export const renameCardFunc = createServerFn({ method: 'POST' })
  .inputValidator(renameCardValidator)
  .handler(async ({ data }): Promise<Card> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: cards, error } = await supabase
      .from('cards')
      .update({ name: data.name, updated: new Date().toISOString() })
      .eq('id', data.cardId)
      .select();

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    if (cards.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to update this card');
    }

    return cards[0];
  });

export const moveCardFunc = createServerFn({ method: 'POST' })
  .inputValidator(moveCardValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: moved, error } = await supabase
      .from('cards')
      .update({
        list: data.listId,
        position: data.position,
        updated: new Date().toISOString()
      })
      .eq('id', data.cardId)
      .select('id');

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    if (moved.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to move this card');
    }

    const { data: siblings } = await supabase
      .from('cards')
      .select('position')
      .eq('list', data.listId)
      .eq('is_active', true);

    if (siblings != null && hasDegenerateGaps(siblings.map((sibling): number | null => sibling.position))) {
      await supabase.rpc('rebalance_card_positions', { target_list: data.listId });
    }
  });

export const setCardActiveFunc = createServerFn({ method: 'POST' })
  .inputValidator(setCardActiveValidator)
  .handler(async ({ data }): Promise<Card> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: cards, error } = await supabase
      .from('cards')
      .update({ is_active: data.isActive, updated: new Date().toISOString() })
      .eq('id', data.cardId)
      .select();

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    if (cards.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to update this card');
    }

    return cards[0];
  });

export const deleteCardFunc = createServerFn({ method: 'POST' })
  .inputValidator(cardIdValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: deleted, error } = await supabase
      .from('cards')
      .delete()
      .eq('id', data.cardId)
      .select('id');

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    if (deleted.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to delete this card');
    }
  });

export const getArchivedCardsFunc = createServerFn({ method: 'GET' })
  .inputValidator(boardIdValidator)
  .handler(async ({ data }): Promise<Array<Card & { lists: { name: string } }>> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);
    await requireBoardAccess(supabase, data.boardId);

    const { data: cards, error } = await supabase
      .from('cards')
      .select('*, lists!inner(name, board)')
      .eq('lists.board', data.boardId)
      .eq('is_active', false)
      .order('updated', { ascending: false });

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    return cards;
  });

export const getCardFunc = createServerFn({ method: 'GET' })
  .inputValidator(cardIdValidator)
  .handler(async ({ data }): Promise<CardDetail> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: card, error } = await supabase
      .from('cards')
      .select()
      .eq('id', data.cardId)
      .single();

    if (error != null) {
      setResponseStatus(404);
      throw error;
    }

    const [labelsResult, checklistResult, activitiesResult, commentsResult, attachmentsResult, commentAttachmentsResult] = await Promise.all([
      supabase.from('card_labels').select('labels(*)').eq('card', data.cardId),
      supabase
        .from('check_list_items')
        .select()
        .eq('card', data.cardId)
        .order('position', { ascending: true, nullsFirst: false }),
      supabase
        .from('card_activities')
        .select()
        .eq('card', data.cardId)
        .order('created_at', { ascending: false }),
      supabase
        .from('comments')
        .select()
        .eq('card', data.cardId)
        .order('created_at', { ascending: true }),
      supabase.rpc('get_card_attachments', { card_id: data.cardId }),
      supabase.rpc('get_comment_attachments', { card_id: data.cardId })
    ]);

    const labels = (labelsResult.data ?? [])
      .map((row): Label | null => row.labels)
      .filter((label): label is Label => label != null);
    const checklistItems = checklistResult.data ?? [];
    const activities = activitiesResult.data ?? [];
    const comments = commentsResult.data ?? [];

    // card_activities.user_id, comments.user_id and cards.assignee all reference
    // auth.users, but profiles has no PostgREST FK to them — resolve every name
    // in one profiles query.
    const userIds = new Set<string>();
    if (card.assignee != null) userIds.add(card.assignee);
    for (const activity of activities) {
      if (activity.user_id != null) userIds.add(activity.user_id);
    }
    for (const comment of comments) {
      if (comment.user_id != null) userIds.add(comment.user_id);
    }

    const profilesById = new Map<string, Profile>();
    if (userIds.size > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select()
        .in('user_id', [...userIds]);

      for (const profile of profiles ?? []) {
        profilesById.set(profile.user_id, profile);
      }
    }

    // Sign each attachment's object with the service-role client (the buckets
    // are private). Access was already gated by the get_*_attachments functions'
    // check_card_access.
    const adminClient = getSupabaseAdminClient();
    const signAttachment = async (
      bucket: string,
      row: { file: string; object_name: string; size: number | null; mime_type: string | null }
    ): Promise<CardAttachment> => {
      const { data: signed } = await adminClient.storage
        .from(bucket)
        .createSignedUrl(row.object_name, SIGNED_URL_TTL_SECONDS);

      return {
        file: row.file,
        name: row.object_name.split('/').pop() ?? row.object_name,
        size: row.size,
        mimeType: row.mime_type,
        url: signed?.signedUrl ?? null
      };
    };

    const attachments = await Promise.all(
      (attachmentsResult.data ?? []).map((row): Promise<CardAttachment> =>
        signAttachment(ATTACHMENTS_BUCKET, row)
      )
    );

    // Group comment attachments by their parent comment.
    const commentAttachments = new Map<string, Array<CardAttachment>>();
    await Promise.all(
      (commentAttachmentsResult.data ?? []).map(async (row): Promise<void> => {
        const signed = await signAttachment(COMMENT_ATTACHMENTS_BUCKET, row);
        const existing = commentAttachments.get(row.comment) ?? [];

        existing.push(signed);
        commentAttachments.set(row.comment, existing);
      })
    );

    return {
      card,
      labels,
      checklistItems,
      activities: activities.map((activity): CardActivityWithAuthor => ({
        ...activity,
        author: activity.user_id != null ? profilesById.get(activity.user_id) ?? null : null
      })),
      comments: comments.map((comment): CommentWithAuthor => ({
        ...comment,
        author: comment.user_id != null ? profilesById.get(comment.user_id) ?? null : null,
        attachments: commentAttachments.get(comment.id) ?? []
      })),
      attachments,
      assignee: card.assignee != null ? profilesById.get(card.assignee) ?? null : null
    };
  });

export const updateCardDetailsFunc = createServerFn({ method: 'POST' })
  .inputValidator(updateCardDetailsValidator)
  .handler(async ({ data }): Promise<Card> => {
    const supabase = getSupabaseServerClient();
    const user = await requireUser(supabase);

    const { data: existing, error: existingError } = await supabase
      .from('cards')
      .select('description, color, due_date, reminder_date')
      .eq('id', data.cardId)
      .single();

    if (existingError != null) {
      setResponseStatus(404);
      throw existingError;
    }

    const { data: cards, error } = await supabase
      .from('cards')
      .update({
        description: data.description,
        color: data.color,
        due_date: data.dueDate,
        reminder_date: data.reminderDate,
        updated: new Date().toISOString()
      })
      .eq('id', data.cardId)
      .select();

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    if (cards.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to update this card');
    }

    if (existing.description !== data.description) {
      await logActivity(supabase, data.cardId, user.id, 'updated the description');
    }
    if (existing.due_date !== data.dueDate) {
      await logActivity(
        supabase,
        data.cardId,
        user.id,
        data.dueDate != null ? 'set the due date' : 'removed the due date'
      );
    }

    return cards[0];
  });

export const setCardAssigneeFunc = createServerFn({ method: 'POST' })
  .inputValidator(setCardAssigneeValidator)
  .handler(async ({ data }): Promise<Card> => {
    const supabase = getSupabaseServerClient();
    const user = await requireUser(supabase);

    const { data: cards, error } = await supabase
      .from('cards')
      .update({ assignee: data.assignee, updated: new Date().toISOString() })
      .eq('id', data.cardId)
      .select();

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    if (cards.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to update this card');
    }

    await logActivity(
      supabase,
      data.cardId,
      user.id,
      data.assignee != null ? 'changed the assignee' : 'removed the assignee'
    );

    return cards[0];
  });
