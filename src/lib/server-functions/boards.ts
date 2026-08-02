import { createServerFn } from '@tanstack/react-start';
import { setResponseStatus } from '@tanstack/react-start/server';
import { getSupabaseServerClient } from '@lib/utils/supabase';
import { requireBoardAccess, requireUser, requireWorkspaceAccess } from '@lib/utils/permissions';
import {
  boardIdValidator,
  createBoardValidator,
  updateBoardValidator
} from '@lib/validators/board';
import type { Tables } from '@lib/types/supabase';
import type { List } from '@lib/server-functions/lists';
import type { Card } from '@lib/server-functions/cards';

export type Board = Tables<'boards'>;
export type BoardDetail = {
  board: Board;
  lists: Array<List>;
  cards: Array<Card>;
};

export const getBoardFunc = createServerFn({ method: 'GET' })
  .inputValidator(boardIdValidator)
  .handler(async ({ data }): Promise<BoardDetail> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);
    await requireBoardAccess(supabase, data.boardId);

    const [boardResult, listsResult, cardsResult] = await Promise.all([
      supabase.from('boards').select().eq('id', data.boardId).single(),
      supabase
        .from('lists')
        .select()
        .eq('board', data.boardId)
        .order('position', { ascending: true, nullsFirst: false }),
      supabase
        .from('cards')
        .select('*, lists!inner(board)')
        .eq('lists.board', data.boardId)
        .eq('is_active', true)
        .order('position', { ascending: true, nullsFirst: false })
    ]);

    if (boardResult.error != null) {
      setResponseStatus(404);
      throw boardResult.error;
    }

    if (listsResult.error != null) {
      setResponseStatus(400);
      throw listsResult.error;
    }

    if (cardsResult.error != null) {
      setResponseStatus(400);
      throw cardsResult.error;
    }

    return {
      board: boardResult.data,
      lists: listsResult.data,
      cards: cardsResult.data.map(({ lists: _lists, ...card }): Card => card)
    };
  });

export const createBoardFunc = createServerFn({ method: 'POST' })
  .inputValidator(createBoardValidator)
  .handler(async ({ data }): Promise<Board> => {
    const supabase = getSupabaseServerClient();
    const user = await requireUser(supabase);
    await requireWorkspaceAccess(supabase, data.workspaceId);

    const { data: board, error } = await supabase
      .from('boards')
      .insert({
        name: data.name,
        workspace: data.workspaceId,
        is_public: data.isPublic,
        user_id: user.id
      })
      .select()
      .single();

    if (error != null) {
      setResponseStatus(403);
      throw error;
    }

    return board;
  });

export const updateBoardFunc = createServerFn({ method: 'POST' })
  .inputValidator(updateBoardValidator)
  .handler(async ({ data }): Promise<Board> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: boards, error } = await supabase
      .from('boards')
      .update({
        name: data.name,
        is_public: data.isPublic,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.boardId)
      .select();

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    // RLS silently updates zero rows when the user lacks permission.
    if (boards.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to update this board');
    }

    return boards[0];
  });

export const deleteBoardFunc = createServerFn({ method: 'POST' })
  .inputValidator(boardIdValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: deleted, error } = await supabase
      .from('boards')
      .delete()
      .eq('id', data.boardId)
      .select('id');

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    if (deleted.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to delete this board');
    }
  });
