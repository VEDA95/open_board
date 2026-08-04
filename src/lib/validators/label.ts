import { z } from 'zod';

export const createLabelValidator = z.object({
  boardId: z.uuid(),
  name: z.string().min(1).max(50),
  color: z.string().min(1).max(20)
});

export const updateLabelValidator = z.object({
  labelId: z.uuid(),
  name: z.string().min(1).max(50),
  color: z.string().min(1).max(20)
});

export const labelIdValidator = z.object({
  labelId: z.uuid()
});

export const cardLabelValidator = z.object({
  cardId: z.uuid(),
  labelId: z.uuid()
});
