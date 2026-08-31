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

export const exchangeCodeValidator = z.object({
  code: z.string().min(1)
});

export const acceptInviteValidator = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(8),
  confirmPassword: z.string().min(8)
}).refine((data): boolean => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export const resetPasswordValidator = z.object({
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data): boolean => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

