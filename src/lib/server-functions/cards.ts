import { createServerFn } from '@tanstack/react-start';
import { setResponseStatus } from '@tanstack/react-start/server';
import { getSupabaseServerClient } from '@lib/utils/supabase';
import { requireBoardAccess, requireUser } from '@lib/utils/permissions';
import { INITIAL_SPACING, hasDegenerateGaps } from '@lib/utils/position';
import {
  cardIdValidator,
  createCardValidator,
  moveCardValidator,
  renameCardValidator,
  setCardActiveValidator
} from '@lib/validators/card';
import { boardIdValidator } from '@lib/validators/board';
import type { Tables } from '@lib/types/supabase';

export type Card = Tables<'cards'>;

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
