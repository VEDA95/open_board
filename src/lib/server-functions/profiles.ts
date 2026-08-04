import { createServerFn } from '@tanstack/react-start';
import { setResponseStatus } from '@tanstack/react-start/server';
import { getSupabaseServerClient } from '@lib/utils/supabase';
import { requireUser } from '@lib/utils/permissions';
import type { Tables } from '@lib/types/supabase';

export type Profile = Tables<'profiles'>;

// Candidate assignees. profiles.select is open to authenticated users, so this
// lists everyone; board-scoped membership filtering arrives with sharing (P8).
export const getProfilesFunc = createServerFn({ method: 'GET' })
  .handler(async (): Promise<Array<Profile>> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select()
      .order('username', { ascending: true });

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    return profiles;
  });
