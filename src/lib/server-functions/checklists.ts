import { createServerFn } from '@tanstack/react-start';
import { setResponseStatus } from '@tanstack/react-start/server';
import { getSupabaseServerClient } from '@lib/utils/supabase';
import { requireUser } from '@lib/utils/permissions';
import { INITIAL_SPACING } from '@lib/utils/position';
import {
  checklistItemIdValidator,
  createChecklistItemValidator,
  renameChecklistItemValidator,
  toggleChecklistItemValidator
} from '@lib/validators/checklist';
import type { Tables } from '@lib/types/supabase';

export type ChecklistItem = Tables<'check_list_items'>;

export const createChecklistItemFunc = createServerFn({ method: 'POST' })
  .inputValidator(createChecklistItemValidator)
  .handler(async ({ data }): Promise<ChecklistItem> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: last } = await supabase
      .from('check_list_items')
      .select('position')
      .eq('card', data.cardId)
      .order('position', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    const { data: item, error } = await supabase
      .from('check_list_items')
      .insert({
        card: data.cardId,
        name: data.name,
        position: (last?.position ?? 0) + INITIAL_SPACING
      })
      .select()
      .single();

    if (error != null) {
      setResponseStatus(403);
      throw error;
    }

    return item;
  });

export const toggleChecklistItemFunc = createServerFn({ method: 'POST' })
  .inputValidator(toggleChecklistItemValidator)
  .handler(async ({ data }): Promise<ChecklistItem> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: items, error } = await supabase
      .from('check_list_items')
      .update({ is_checked: data.isChecked, updated_at: new Date().toISOString() })
      .eq('id', data.itemId)
      .select();

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    if (items.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to update this item');
    }

    return items[0];
  });

export const renameChecklistItemFunc = createServerFn({ method: 'POST' })
  .inputValidator(renameChecklistItemValidator)
  .handler(async ({ data }): Promise<ChecklistItem> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: items, error } = await supabase
      .from('check_list_items')
      .update({ name: data.name, updated_at: new Date().toISOString() })
      .eq('id', data.itemId)
      .select();

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    if (items.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to update this item');
    }

    return items[0];
  });

export const deleteChecklistItemFunc = createServerFn({ method: 'POST' })
  .inputValidator(checklistItemIdValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: deleted, error } = await supabase
      .from('check_list_items')
      .delete()
      .eq('id', data.itemId)
      .select('id');

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    if (deleted.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to delete this item');
    }
  });
