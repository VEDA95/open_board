import { z } from 'zod';

export const createBoardValidator = z.object({
  workspaceId: z.uuid(),
  name: z.string().min(1).max(100),
  isPublic: z.boolean()
});

export const updateBoardValidator = z.object({
  boardId: z.uuid(),
  name: z.string().min(1).max(100),
  isPublic: z.boolean()
});

export const boardIdValidator = z.object({
  boardId: z.uuid()
});
