// Centralized React Query key factory — never use inline string keys.
export const queryKeys = {
  user: ['user'] as const,
  workspaces: ['workspaces'] as const,
  workspace: (workspaceId: string) => ['workspace', workspaceId] as const,
  workspaceMembers: (workspaceId: string) => ['workspace-members', workspaceId] as const,
  board: (boardId: string) => ['board', boardId] as const,
  boardMembers: (boardId: string) => ['board-members', boardId] as const,
  card: (cardId: string) => ['card', cardId] as const,
  comments: (cardId: string) => ['comments', cardId] as const,
  labels: (boardId: string) => ['labels', boardId] as const,
  profiles: ['profiles'] as const,
  myProfile: ['my-profile'] as const,
  realtimeConfig: ['realtime-config'] as const,
  // Prefix of the two app-settings queries below — invalidate it to refresh both.
  appSettings: ['app-settings'] as const,
  generalAppSettings: ['app-settings', 'general'] as const,
  appAuthSettings: ['app-settings', 'auth'] as const,
  adminSettings: ['admin', 'settings'] as const,
  adminRoles: ['admin', 'roles'] as const,
  adminUsers: ['admin', 'users'] as const,
};
