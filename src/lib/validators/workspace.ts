import { z } from 'zod';

export const createWorkspaceValidator = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean()
});

export const updateWorkspaceValidator = z.object({
  workspaceId: z.uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean()
});

export const workspaceIdValidator = z.object({
  workspaceId: z.uuid()
});

// Form-side variant: TanStack Form models the optional description as a
// required `string | undefined` value, which zod's `.optional()` (optional
// key) does not satisfy structurally.
export const workspaceFormValidator = z.object({
  name: z.string().min(1).max(100),
  description: z.union([z.string().max(500), z.undefined()]),
  isPublic: z.boolean()
});
