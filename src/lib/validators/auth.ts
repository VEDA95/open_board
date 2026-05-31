import {z} from 'zod';

export const loginValidator = z.object({
  email: z.email(),
  password: z.string().min(8)
});
