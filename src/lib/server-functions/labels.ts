import { createServerFn } from '@tanstack/react-start';
import { setResponseStatus } from '@tanstack/react-start/server';
import { getSupabaseServerClient } from '@lib/utils/supabase';
import { requireBoardAccess, requireUser } from '@lib/utils/permissions';
import { logActivity } from '@lib/server-functions/activity';
import {
  cardLabelValidator,
  createLabelValidator,
  labelIdValidator,
  updateLabelValidator
} from '@lib/validators/label';
import { boardIdValidator } from '@lib/validators/board';
import type { Tables } from '@lib/types/supabase';

export type Label = Tables<'labels'>;

export const getLabelsFunc = createServerFn({ method: 'GET' })
  .inputValidator(boardIdValidator)
  .handler(async ({ data }): Promise<Array<Label>> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);
    await requireBoardAccess(supabase, data.boardId);

    const { data: labels, error } = await supabase
      .from('labels')
      .select()
      .eq('board', data.boardId)
      .order('created_at', { ascending: true });

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    return labels;
  });

export const createLabelFunc = createServerFn({ method: 'POST' })
  .inputValidator(createLabelValidator)
  .handler(async ({ data }): Promise<Label> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);
    await requireBoardAccess(supabase, data.boardId);

    const { data: label, error } = await supabase
      .from('labels')
      .insert({ board: data.boardId, name: data.name, color: data.color })
      .select()
      .single();

    if (error != null) {
      setResponseStatus(403);
      throw error;
    }

    return label;
  });

export const updateLabelFunc = createServerFn({ method: 'POST' })
  .inputValidator(updateLabelValidator)
  .handler(async ({ data }): Promise<Label> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: labels, error } = await supabase
      .from('labels')
      .update({ name: data.name, color: data.color, updated_at: new Date().toISOString() })
      .eq('id', data.labelId)
      .select();

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    if (labels.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to update this label');
    }

    return labels[0];
  });

export const deleteLabelFunc = createServerFn({ method: 'POST' })
  .inputValidator(labelIdValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: deleted, error } = await supabase
      .from('labels')
      .delete()
      .eq('id', data.labelId)
      .select('id');

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    if (deleted.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to delete this label');
    }
  });

export const addCardLabelFunc = createServerFn({ method: 'POST' })
  .inputValidator(cardLabelValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    const user = await requireUser(supabase);

    const { error } = await supabase
      .from('card_labels')
      .insert({ card: data.cardId, label: data.labelId });

    if (error != null) {
      setResponseStatus(403);
      throw error;
    }

    await logActivity(supabase, data.cardId, user.id, 'added a label');
  });

export const removeCardLabelFunc = createServerFn({ method: 'POST' })
  .inputValidator(cardLabelValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    const user = await requireUser(supabase);

    const { error } = await supabase
      .from('card_labels')
      .delete()
      .eq('card', data.cardId)
      .eq('label', data.labelId);

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    await logActivity(supabase, data.cardId, user.id, 'removed a label');
  });
