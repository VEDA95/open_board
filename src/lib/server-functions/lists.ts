import { createServerFn } from '@tanstack/react-start';
import { setResponseStatus } from '@tanstack/react-start/server';
import { getSupabaseServerClient } from '@lib/utils/supabase';
import { requireBoardAccess, requireUser } from '@lib/utils/permissions';
import { INITIAL_SPACING, hasDegenerateGaps } from '@lib/utils/position';
import {
  createListValidator,
  listIdValidator,
  moveListValidator,
  updateListValidator
} from '@lib/validators/list';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables } from '@lib/types/supabase';

export type List = Tables<'lists'>;

async function getListBoardId(supabase: SupabaseClient<Database>, listId: string): Promise<string> {
  const { data, error } = await supabase
    .from('lists')
    .select('board')
    .eq('id', listId)
    .single();

  if (error != null) {
    setResponseStatus(404);
    throw error;
  }

  return data.board;
}

export const createListFunc = createServerFn({ method: 'POST' })
  .inputValidator(createListValidator)
  .handler(async ({ data }): Promise<List> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);
    await requireBoardAccess(supabase, data.boardId);

    const { data: last } = await supabase
      .from('lists')
      .select('position')
      .eq('board', data.boardId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: list, error } = await supabase
      .from('lists')
      .insert({
        name: data.name,
        board: data.boardId,
        position: (last?.position ?? 0) + INITIAL_SPACING
      })
      .select()
      .single();

    if (error != null) {
      setResponseStatus(403);
      throw error;
    }

    return list;
  });

export const updateListFunc = createServerFn({ method: 'POST' })
  .inputValidator(updateListValidator)
  .handler(async ({ data }): Promise<List> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: lists, error } = await supabase
      .from('lists')
      .update({ name: data.name, updated_at: new Date().toISOString() })
      .eq('id', data.listId)
      .select();

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    if (lists.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to update this list');
    }

    return lists[0];
  });

export const moveListFunc = createServerFn({ method: 'POST' })
  .inputValidator(moveListValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const boardId = await getListBoardId(supabase, data.listId);

    const { data: moved, error } = await supabase
      .from('lists')
      .update({ position: data.position, updated_at: new Date().toISOString() })
      .eq('id', data.listId)
      .select('id');

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    if (moved.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to move this list');
    }

    const { data: siblings } = await supabase
      .from('lists')
      .select('position')
      .eq('board', boardId);

    if (siblings != null && hasDegenerateGaps(siblings.map((sibling): number | null => sibling.position))) {
      await supabase.rpc('rebalance_list_positions', { target_board: boardId });
    }
  });

export const deleteListFunc = createServerFn({ method: 'POST' })
  .inputValidator(listIdValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: deleted, error } = await supabase
      .from('lists')
      .delete()
      .eq('id', data.listId)
      .select('id');

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    if (deleted.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to delete this list');
    }
  });
