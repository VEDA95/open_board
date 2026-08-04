import { z } from 'zod';

export const createCommentValidator = z.object({
  cardId: z.uuid(),
  comment: z.string().min(1).max(5000)
});

export const updateCommentValidator = z.object({
  commentId: z.uuid(),
  comment: z.string().min(1).max(5000)
});

export const commentIdValidator = z.object({
  commentId: z.uuid()
});

// Upload limits enforced server-side (FormData can't be validated with Zod).
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_MIME = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];
