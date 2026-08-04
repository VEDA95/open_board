import { createServerFn } from '@tanstack/react-start';
import { setResponseStatus } from '@tanstack/react-start/server';
import { getSupabaseServerClient } from '@lib/utils/supabase';
import { requireUser } from '@lib/utils/permissions';
import { logActivity } from '@lib/server-functions/activity';
import {
  commentIdValidator,
  createCommentValidator,
  updateCommentValidator
} from '@lib/validators/comment';
import type { Tables } from '@lib/types/supabase';

export type Comment = Tables<'comments'>;

export const addCommentFunc = createServerFn({ method: 'POST' })
  .inputValidator(createCommentValidator)
  .handler(async ({ data }): Promise<Comment> => {
    const supabase = getSupabaseServerClient();
    const user = await requireUser(supabase);

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({ card: data.cardId, comment: data.comment, user_id: user.id })
      .select()
      .single();

    if (error != null) {
      setResponseStatus(403);
      throw error;
    }

    await logActivity(supabase, data.cardId, user.id, 'added a comment');

    return comment;
  });

export const updateCommentFunc = createServerFn({ method: 'POST' })
  .inputValidator(updateCommentValidator)
  .handler(async ({ data }): Promise<Comment> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: comments, error } = await supabase
      .from('comments')
      .update({ comment: data.comment, updated_at: new Date().toISOString() })
      .eq('id', data.commentId)
      .select();

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    if (comments.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to edit this comment');
    }

    return comments[0];
  });

export const deleteCommentFunc = createServerFn({ method: 'POST' })
  .inputValidator(commentIdValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: deleted, error } = await supabase
      .from('comments')
      .delete()
      .eq('id', data.commentId)
      .select('id');

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    if (deleted.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to delete this comment');
    }
  });
