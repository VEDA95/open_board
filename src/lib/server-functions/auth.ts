import { createServerFn } from '@tanstack/react-start';
import { setResponseStatus } from '@tanstack/react-start/server';
import { supabase } from '@lib/utils/supabase';
import {
  forgotPasswordValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator
} from '@lib/validators/auth';
import type { AuthResponse, AuthTokenResponsePassword, PostgrestSingleResponse, UserResponse } from '@supabase/supabase-js';

export const loginFunc = createServerFn({ method: 'POST' })
  .inputValidator(loginValidator)
  .handler(async ({ data }): Promise<void> => {
    const { error }: AuthTokenResponsePassword = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });

    if (error == null) return;

    setResponseStatus(401);
    throw error;
  });

export const registerFunc = createServerFn({ method: 'POST' })
  .inputValidator(registerValidator)
  .handler(async ({ data }): Promise<void> => {
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
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: 'http://localhost:3000/auth/reset-password'
    });

    if (error == null) return;

    setResponseStatus(400);
    throw error;
  });

export const resetPasswordFunc = createServerFn({ method: 'POST' })
  .inputValidator(resetPasswordValidator)
  .handler(async ({ data }): Promise<void> => {
    const { error }: UserResponse = await supabase.auth.updateUser({
      password: data.password
    });

    if (error == null) return;

    setResponseStatus(400);
    throw error;
  });
