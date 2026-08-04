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

export const updateCardDetailsValidator = z.object({
  cardId: z.uuid(),
  description: z.string().max(5000).nullable(),
  color: z.string().max(20).nullable(),
  dueDate: z.string().nullable(),
  reminderDate: z.string().nullable()
});

export const setCardAssigneeValidator = z.object({
  cardId: z.uuid(),
  assignee: z.uuid().nullable()
});
