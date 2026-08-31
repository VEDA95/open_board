import { z } from 'zod';

export const workspaceShareValidator = z.object({
  workspaceId: z.uuid(),
  userId: z.uuid()
});

export const workspaceIdShareValidator = z.object({
  workspaceId: z.uuid()
});

export const boardShareValidator = z.object({
  boardId: z.uuid(),
  userId: z.uuid()
});

export const boardIdShareValidator = z.object({
  boardId: z.uuid()
});

export const workspaceAccessValidator = z.object({
  workspaceId: z.uuid(),
  permissionId: z.uuid()
});

export const boardAccessValidator = z.object({
  boardId: z.uuid(),
  permissionId: z.uuid()
});
