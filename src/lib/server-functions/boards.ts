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
import type { Card, Profile } from '@lib/server-functions/cards';
import type { Label } from '@lib/server-functions/labels';

export type Board = Tables<'boards'>;
// Card enriched with the bits its face shows on the board.
export type BoardCard = Card & {
  labels: Array<Label>;
  assigneeProfile: Profile | null;
};
export type BoardDetail = {
  board: Board;
  workspaceIsPublic: boolean;
  lists: Array<List>;
  cards: Array<BoardCard>;
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
        .select('*, lists!inner(board), card_labels(labels(*))')
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

    // Resolve assignee display names in one query (profiles has no PostgREST FK
    // to auth.users, so it can't be embedded above).
    const assigneeIds = [
      ...new Set(
        cardsResult.data
          .map((card): string | null => card.assignee)
          .filter((id): id is string => id != null)
      )
    ];
    const profilesById = new Map<string, Profile>();
    if (assigneeIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select()
        .in('user_id', assigneeIds);

      for (const profile of profiles ?? []) {
        profilesById.set(profile.user_id, profile);
      }
    }

    // Board sharing is only meaningful when access is restricted somewhere —
    // the board's visibility plus its workspace's visibility decide that.
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('is_public')
      .eq('id', boardResult.data.workspace)
      .single();

    return {
      board: boardResult.data,
      workspaceIsPublic: workspace?.is_public ?? false,
      lists: listsResult.data,
      cards: cardsResult.data.map(({ lists: _lists, card_labels, ...card }): BoardCard => ({
        ...card,
        labels: card_labels
          .map((row): Label | null => row.labels)
          .filter((label): label is Label => label != null),
        assigneeProfile: card.assignee != null ? profilesById.get(card.assignee) ?? null : null
      }))
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
