import { createServerFn } from '@tanstack/react-start';
import { setResponseStatus } from '@tanstack/react-start/server';
import { getSupabaseServerClient } from '@lib/utils/supabase';
import { getSupabaseAdminClient } from '@lib/utils/supabase-admin';
import {
  exchangeCodeValidator,
  forgotPasswordValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator
} from '@lib/validators/auth';
import type { AuthError, AuthResponse, AuthTokenResponsePassword, PostgrestSingleResponse, UserResponse } from '@supabase/supabase-js';
import type { AuthState } from '@lib/types/auth';

export const getUserFunc = createServerFn({ method: 'GET' })
  .handler(async (): Promise<AuthState> => {
    const supabase = getSupabaseServerClient();
    const { data: { user } }: UserResponse = await supabase.auth.getUser();

    if (user == null) return { user: null, permissions: [] };

    const { data: permissions } = await supabase.rpc('get_user_permission_paths');

    return { user, permissions: permissions ?? [] };
  });

export const loginFunc = createServerFn({ method: 'POST' })
  .inputValidator(loginValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    const { error }: AuthTokenResponsePassword = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });

    if (error == null) return;

    setResponseStatus(401);
    throw error;
  });

export const logoutFunc = createServerFn({ method: 'POST' })
  .handler(async (): Promise<void> => {
    const supabase = getSupabaseServerClient();
    const { error }: { error: AuthError | null } = await supabase.auth.signOut();

    if (error == null) return;

    setResponseStatus(400);
    throw error;
  });

export const registerFunc = createServerFn({ method: 'POST' })
  .inputValidator(registerValidator)
  .handler(async ({ data }): Promise<void> => {
    // auth_settings is only readable by authenticated users, so the
    // registration toggle is checked with the service-role client.
    const adminClient = getSupabaseAdminClient();
    const { data: settings } = await adminClient
      .from('auth_settings')
      .select('enable_registration')
      .eq('id', 1)
      .single();

    if (settings?.enable_registration !== true) {
      setResponseStatus(403);
      throw new Error('Public registration is disabled');
    }

    const supabase = getSupabaseServerClient();
    const { error, data: responseData }: AuthResponse = await supabase.auth.signUp({
      email: data.email,
      password: data.password
    });

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    const { error: error2 }: PostgrestSingleResponse<null> = await supabase
      .from('profiles')
      .update({
        username: data.username,
        first_name: data.firstName,
        last_name: data.lastName
      })
      .eq('user_id', responseData.user?.id as string);

    if (error2 == null) return;

    setResponseStatus(400);
    throw error2;
  });

export const forgotPasswordFunc = createServerFn({ method: 'POST' })
  .inputValidator(forgotPasswordValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${process.env.APP_URL ?? 'http://localhost:3000'}/auth/reset-password`
    });

    if (error == null) return;

    setResponseStatus(400);
    throw error;
  });

export const exchangeCodeFunc = createServerFn({ method: 'POST' })
  .inputValidator(exchangeCodeValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(data.code);

    if (error == null) return;

    setResponseStatus(400);
    throw error;
  });

export const resetPasswordFunc = createServerFn({ method: 'POST' })
  .inputValidator(resetPasswordValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    const { error }: UserResponse = await supabase.auth.updateUser({
      password: data.password
    });

    if (error == null) return;

    setResponseStatus(400);
    throw error;
  });
