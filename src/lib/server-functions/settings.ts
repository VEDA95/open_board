import { createServerFn } from '@tanstack/react-start';
import { setResponseStatus } from '@tanstack/react-start/server';
import { getSupabaseServerClient } from '@lib/utils/supabase';
import { requireUser } from '@lib/utils/permissions';
import type { Tables } from '@lib/types/supabase';

export type AppSettings = Tables<'general_settings'>;

// App-wide settings readable by any signed-in user (general_settings select is
// open). Used for the announcement banner and app name in the shell — distinct
// from getAdminSettingsFunc, which is permission-gated and returns more.
export const getAppSettingsFunc = createServerFn({ method: 'GET' })
  .handler(async (): Promise<AppSettings> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data, error } = await supabase
      .from('general_settings')
      .select()
      .eq('id', 1)
      .single();

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    return data;
  });
