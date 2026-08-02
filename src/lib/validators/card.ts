import { z } from 'zod';

export const createCardValidator = z.object({
  listId: z.uuid(),
  name: z.string().min(1).max(200)
});

export const renameCardValidator = z.object({
  cardId: z.uuid(),
  name: z.string().min(1).max(200)
});

export const moveCardValidator = z.object({
  cardId: z.uuid(),
  listId: z.uuid(),
  position: z.number().finite()
});

export const setCardActiveValidator = z.object({
  cardId: z.uuid(),
  isActive: z.boolean()
});

export const cardIdValidator = z.object({
  cardId: z.uuid()
});
