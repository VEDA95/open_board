import { z } from 'zod';

export const updateProfileValidator = z.object({
  username: z.string().min(1).max(50),
  firstName: z.string().max(100),
  lastName: z.string().max(100)
});

export const changePasswordValidator = z.object({
  password: z.string().min(8),
  confirmPassword: z.string().min(8)
}).refine((data): boolean => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
