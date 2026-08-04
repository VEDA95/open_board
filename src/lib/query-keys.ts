// Centralized React Query key factory — never use inline string keys.
export const queryKeys = {
  user: ['user'] as const,
  workspaces: ['workspaces'] as const,
  workspace: (workspaceId: string) => ['workspace', workspaceId] as const,
  board: (boardId: string) => ['board', boardId] as const,
  card: (cardId: string) => ['card', cardId] as const,
  comments: (cardId: string) => ['comments', cardId] as const,
  labels: (boardId: string) => ['labels', boardId] as const,
  profiles: ['profiles'] as const,
  realtimeConfig: ['realtime-config'] as const,
  settings: ['settings'] as const,
};
