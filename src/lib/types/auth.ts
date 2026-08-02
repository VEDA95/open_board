import type { User } from '@supabase/supabase-js';

export type LoginData = {
  email: string;
  password: string;
};

export type AuthState = {
  user: User | null;
  permissions: Array<string>;
};
