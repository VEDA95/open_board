import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@lib/query-keys';
import { useBroadcastChannel } from '@lib/hooks/use-realtime';
import type { BroadcastPayload } from '@lib/hooks/use-realtime';

// Live updates for a workspace: board add/remove/rename and workspace-row
// changes broadcast to workspace:{id}. Refresh the workspace detail (its boards
// grid) and the workspaces list.
export function useWorkspaceRealtime(workspaceId: string): void {
  const queryClient = useQueryClient();

  const onMessage = useCallback(
    (_payload: BroadcastPayload): void => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
    [queryClient, workspaceId]
  );

  useBroadcastChannel(`workspace:${workspaceId}`, onMessage);
}
