import { z } from 'zod';

export const createListValidator = z.object({
  boardId: z.uuid(),
  name: z.string().min(1).max(100)
});

export const updateListValidator = z.object({
  listId: z.uuid(),
  name: z.string().min(1).max(100)
});

export const moveListValidator = z.object({
  listId: z.uuid(),
  position: z.number().finite()
});

export const listIdValidator = z.object({
  listId: z.uuid()
});
