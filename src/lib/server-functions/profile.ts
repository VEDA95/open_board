import { createServerFn } from '@tanstack/react-start';
import { setResponseStatus } from '@tanstack/react-start/server';
import { getSupabaseServerClient } from '@lib/utils/supabase';
import { getSupabaseAdminClient } from '@lib/utils/supabase-admin';
import { requireUser } from '@lib/utils/permissions';
import {
  AVATAR_ALLOWED_MIME,
  AVATAR_MAX_BYTES,
  changePasswordValidator,
  updateProfileValidator
} from '@lib/validators/profile';
import type { Tables } from '@lib/types/supabase';

export type Profile = Tables<'profiles'>;
export type MyProfile = {
  profile: Profile;
  email: string | null;
  avatarUrl: string | null;
};

const THUMBNAILS_BUCKET = 'thumbnails';

async function resolveAvatarUrl(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  thumbnail: string | null
): Promise<string | null> {
  if (thumbnail == null) return null;

  const { data } = await supabase.rpc('get_thumbnail_paths', { object_ids: [thumbnail] });
  const path = data?.[0]?.object_name;

  if (path == null) return null;

  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${THUMBNAILS_BUCKET}/${path}`;
}

export const getMyProfileFunc = createServerFn({ method: 'GET' })
  .handler(async (): Promise<MyProfile> => {
    const supabase = getSupabaseServerClient();
    const user = await requireUser(supabase);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select()
      .eq('user_id', user.id)
      .single();

    if (error != null) {
      setResponseStatus(404);
      throw error;
    }

    return {
      profile,
      email: user.email ?? null,
      avatarUrl: await resolveAvatarUrl(supabase, profile.thumbnail)
    };
  });

export const updateProfileFunc = createServerFn({ method: 'POST' })
  .inputValidator(updateProfileValidator)
  .handler(async ({ data }): Promise<Profile> => {
    const supabase = getSupabaseServerClient();
    const user = await requireUser(supabase);

    const { data: profiles, error } = await supabase
      .from('profiles')
      .update({
        username: data.username,
        first_name: data.firstName,
        last_name: data.lastName
      })
      .eq('user_id', user.id)
      .select();

    if (error != null) {
      // 23505 = unique violation on the username index.
      setResponseStatus(error.code === '23505' ? 409 : 400);
      throw new Error(error.code === '23505' ? 'That username is already taken' : error.message);
    }

    if (profiles.length === 0) {
      setResponseStatus(403);
      throw new Error('Could not update your profile');
    }

    return profiles[0];
  });

export const changePasswordFunc = createServerFn({ method: 'POST' })
  .inputValidator(changePasswordValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { error } = await supabase.auth.updateUser({ password: data.password });

    if (error == null) return;

    setResponseStatus(400);
    throw error;
  });

export const uploadAvatarFunc = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown): { file: File } => {
    if (!(data instanceof FormData)) throw new Error('Expected form data');

    const file = data.get('file');

    if (!(file instanceof File)) throw new Error('Missing file');
    if (file.size > AVATAR_MAX_BYTES) throw new Error('Image exceeds the 5MB limit');
    if (!AVATAR_ALLOWED_MIME.includes(file.type)) throw new Error('Unsupported image type');

    return { file };
  })
  .handler(async ({ data }): Promise<{ avatarUrl: string | null }> => {
    const supabase = getSupabaseServerClient();
    const user = await requireUser(supabase);

    const { data: existing } = await supabase
      .from('profiles')
      .select('thumbnail')
      .eq('user_id', user.id)
      .single();

    const safeName = data.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${user.id}/${crypto.randomUUID()}/${safeName}`;

    const { data: uploaded, error: uploadError } = await supabase.storage
      .from(THUMBNAILS_BUCKET)
      .upload(path, data.file, { contentType: data.file.type, upsert: false });

    if (uploadError != null) {
      setResponseStatus(400);
      throw uploadError;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ thumbnail: uploaded.id })
      .eq('user_id', user.id);

    if (updateError != null) {
      await supabase.storage.from(THUMBNAILS_BUCKET).remove([path]);
      setResponseStatus(400);
      throw updateError;
    }

    // Remove the previous avatar object (thumbnail FK is ON DELETE SET NULL,
    // but the row now points elsewhere; clean up the orphan via admin).
    if (existing?.thumbnail != null) {
      const { data: oldPath } = await supabase.rpc('get_thumbnail_paths', {
        object_ids: [existing.thumbnail]
      });

      if (oldPath?.[0]?.object_name != null) {
        await getSupabaseAdminClient().storage
          .from(THUMBNAILS_BUCKET)
          .remove([oldPath[0].object_name]);
      }
    }

    return {
      avatarUrl: `${process.env.SUPABASE_URL}/storage/v1/object/public/${THUMBNAILS_BUCKET}/${path}`
    };
  });
