import { z } from 'zod';

export const loginValidator = z.object({
  email: z.email(),
  password: z.string().min(8)
});

export const registerValidator = z.object({
  email: z.email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  username: z.string().min(1),
  firstName: z.string(),
  lastName: z.string(),
}).refine((data): boolean => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export const forgotPasswordValidator = z.object({
  email: z.email()
});

export const resetPasswordValidator = z.object({
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data): boolean => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

