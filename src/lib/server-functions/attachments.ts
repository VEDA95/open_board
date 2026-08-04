import { createServerFn } from '@tanstack/react-start';
import { setResponseStatus } from '@tanstack/react-start/server';
import { getSupabaseServerClient } from '@lib/utils/supabase';
import { getSupabaseAdminClient } from '@lib/utils/supabase-admin';
import { requireUser } from '@lib/utils/permissions';
import { logActivity } from '@lib/server-functions/activity';
import { ALLOWED_ATTACHMENT_MIME, MAX_ATTACHMENT_BYTES } from '@lib/validators/comment';
import { z } from 'zod';

const ATTACHMENTS_BUCKET = 'card_attachments';
const COMMENT_ATTACHMENTS_BUCKET = 'comment_attachments';

const deleteAttachmentValidator = z.object({
  cardId: z.uuid(),
  file: z.uuid()
});

const deleteCommentAttachmentValidator = z.object({
  cardId: z.uuid(),
  commentId: z.uuid(),
  file: z.uuid()
});

function validateUploadFormData(data: unknown, idField: string): { id: string; file: File } {
  if (!(data instanceof FormData)) {
    throw new Error('Expected form data');
  }

  const id = data.get(idField);
  const file = data.get('file');

  if (typeof id !== 'string') throw new Error(`Missing ${idField}`);
  if (!(file instanceof File)) throw new Error('Missing file');
  if (file.size > MAX_ATTACHMENT_BYTES) throw new Error('File exceeds the 10MB limit');
  if (!ALLOWED_ATTACHMENT_MIME.includes(file.type)) throw new Error('Unsupported file type');

  return { id, file };
}

export const uploadCardAttachmentFunc = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown): { id: string; file: File } => validateUploadFormData(data, 'cardId'))
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    const user = await requireUser(supabase);

    // Storage insert policy requires the first path segment to be the user's
    // id; the random uuid folder keeps the display filename clean.
    const safeName = data.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${user.id}/${crypto.randomUUID()}/${safeName}`;

    const { data: uploaded, error: uploadError } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .upload(path, data.file, { contentType: data.file.type, upsert: false });

    if (uploadError != null) {
      setResponseStatus(400);
      throw uploadError;
    }

    const { error: linkError } = await supabase
      .from('card_attachments')
      .insert({ card: data.id, file: uploaded.id });

    if (linkError != null) {
      // Don't leave an orphaned object if the junction insert is rejected.
      await supabase.storage.from(ATTACHMENTS_BUCKET).remove([path]);
      setResponseStatus(403);
      throw linkError;
    }

    await logActivity(supabase, data.id, user.id, 'added an attachment');
  });

export const uploadCommentAttachmentFunc = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown): { id: string; file: File } => validateUploadFormData(data, 'commentId'))
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    const user = await requireUser(supabase);

    const safeName = data.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${user.id}/${crypto.randomUUID()}/${safeName}`;

    const { data: uploaded, error: uploadError } = await supabase.storage
      .from(COMMENT_ATTACHMENTS_BUCKET)
      .upload(path, data.file, { contentType: data.file.type, upsert: false });

    if (uploadError != null) {
      setResponseStatus(400);
      throw uploadError;
    }

    // The junction insert policy requires the comment to be the caller's own.
    const { error: linkError } = await supabase
      .from('comment_attachments')
      .insert({ comment: data.id, file: uploaded.id });

    if (linkError != null) {
      await supabase.storage.from(COMMENT_ATTACHMENTS_BUCKET).remove([path]);
      setResponseStatus(403);
      throw linkError;
    }
  });

export const deleteCardAttachmentFunc = createServerFn({ method: 'POST' })
  .inputValidator(deleteAttachmentValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    // Resolve the object path (RLS-gated by check_card_access) before unlinking.
    const { data: attachments } = await supabase.rpc('get_card_attachments', {
      card_id: data.cardId
    });
    const target = (attachments ?? []).find((row): boolean => row.file === data.file);

    const { data: deleted, error } = await supabase
      .from('card_attachments')
      .delete()
      .eq('card', data.cardId)
      .eq('file', data.file)
      .select('file');

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    if (deleted.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to delete this attachment');
    }

    // Remove the underlying object with the service-role client (the storage
    // delete policy is owner-scoped; a board manager may not be the uploader).
    if (target?.object_name != null) {
      await getSupabaseAdminClient().storage
        .from(ATTACHMENTS_BUCKET)
        .remove([target.object_name]);
    }
  });

export const deleteCommentAttachmentFunc = createServerFn({ method: 'POST' })
  .inputValidator(deleteCommentAttachmentValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: attachments } = await supabase.rpc('get_comment_attachments', {
      card_id: data.cardId
    });
    const target = (attachments ?? []).find(
      (row): boolean => row.comment === data.commentId && row.file === data.file
    );

    // Junction delete policy: only the comment owner (or board manager).
    const { data: deleted, error } = await supabase
      .from('comment_attachments')
      .delete()
      .eq('comment', data.commentId)
      .eq('file', data.file)
      .select('file');

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    if (deleted.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to delete this attachment');
    }

    if (target?.object_name != null) {
      await getSupabaseAdminClient().storage
        .from(COMMENT_ATTACHMENTS_BUCKET)
        .remove([target.object_name]);
    }
  });
