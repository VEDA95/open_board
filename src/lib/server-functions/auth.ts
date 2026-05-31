import {createServerFn} from '@tanstack/react-start';
import {setResponseStatus} from '@tanstack/react-start/server';
import {supabase} from '@lib/utils/supabase';
import {loginValidator} from '@lib/validators/auth';
import type {AuthTokenResponsePassword} from '@supabase/supabase-js';

export const loginFunc = createServerFn({method: 'POST'})
  .inputValidator(loginValidator)
  .handler(async ({data}): Promise<void> => {
    const { error }: AuthTokenResponsePassword = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });

    if(error == null) return;

    setResponseStatus(401);
    throw error;
  });
