import { createServerFn } from '@tanstack/react-start';
import { setResponseStatus } from '@tanstack/react-start/server';
import { getSupabaseServerClient } from '@lib/utils/supabase';
import { getSupabaseAdminClient } from '@lib/utils/supabase-admin';
import { requirePermissions, requireUser } from '@lib/utils/permissions';
import { inviteUserValidator } from '@lib/validators/admin';

// Invite a user by email. Creates the auth user (invited_at set, so the
// handle_new_user trigger grants them the private_registration default roles)
// and emails an accept-invite link. Requires user:manage; service-role only.
export const inviteUserFunc = createServerFn({ method: 'POST' })
  .inputValidator(inviteUserValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);
    await requirePermissions(supabase, 'user:manage');

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const { error } = await getSupabaseAdminClient().auth.admin.inviteUserByEmail(data.email, {
      redirectTo: `${appUrl}/auth/accept-invite`
    });

    if (error == null) return;

    setResponseStatus(400);
    throw error;
  });
