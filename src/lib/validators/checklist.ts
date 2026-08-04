import { z } from 'zod';

export const createChecklistItemValidator = z.object({
  cardId: z.uuid(),
  name: z.string().min(1).max(500)
});

export const toggleChecklistItemValidator = z.object({
  itemId: z.uuid(),
  isChecked: z.boolean()
});

export const renameChecklistItemValidator = z.object({
  itemId: z.uuid(),
  name: z.string().min(1).max(500)
});

export const checklistItemIdValidator = z.object({
  itemId: z.uuid()
});
