import { createServerFn } from '@tanstack/react-start';
import { setResponseStatus } from '@tanstack/react-start/server';
import { getSupabaseServerClient } from '@lib/utils/supabase';
import { requireUser, requireWorkspaceAccess } from '@lib/utils/permissions';
import {
  createWorkspaceValidator,
  updateWorkspaceValidator,
  workspaceIdValidator
} from '@lib/validators/workspace';
import type { Tables } from '@lib/types/supabase';

export type Workspace = Tables<'workspaces'>;
export type WorkspaceBoard = Pick<Tables<'boards'>, 'id' | 'name' | 'is_public' | 'created_at'>;
export type WorkspaceDetail = {
  workspace: Workspace;
  boards: Array<WorkspaceBoard>;
};

export const getWorkspacesFunc = createServerFn({ method: 'GET' })
  .handler(async (): Promise<Array<Workspace>> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data, error } = await supabase
      .from('workspaces')
      .select()
      .order('created_at', { ascending: true });

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    return data;
  });

export const getWorkspaceFunc = createServerFn({ method: 'GET' })
  .inputValidator(workspaceIdValidator)
  .handler(async ({ data }): Promise<WorkspaceDetail> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);
    await requireWorkspaceAccess(supabase, data.workspaceId);

    const [workspaceResult, boardsResult] = await Promise.all([
      supabase.from('workspaces').select().eq('id', data.workspaceId).single(),
      supabase
        .from('boards')
        .select('id, name, is_public, created_at')
        .eq('workspace', data.workspaceId)
        .order('created_at', { ascending: true })
    ]);

    if (workspaceResult.error != null) {
      setResponseStatus(404);
      throw workspaceResult.error;
    }

    if (boardsResult.error != null) {
      setResponseStatus(400);
      throw boardsResult.error;
    }

    return { workspace: workspaceResult.data, boards: boardsResult.data };
  });

export const createWorkspaceFunc = createServerFn({ method: 'POST' })
  .inputValidator(createWorkspaceValidator)
  .handler(async ({ data }): Promise<Workspace> => {
    const supabase = getSupabaseServerClient();
    const user = await requireUser(supabase);

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .insert({
        name: data.name,
        description: data.description ?? null,
        is_public: data.isPublic,
        user_id: user.id
      })
      .select()
      .single();

    if (error != null) {
      setResponseStatus(403);
      throw error;
    }

    return workspace;
  });

export const updateWorkspaceFunc = createServerFn({ method: 'POST' })
  .inputValidator(updateWorkspaceValidator)
  .handler(async ({ data }): Promise<Workspace> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);
    await requireWorkspaceAccess(supabase, data.workspaceId);

    const { data: workspaces, error } = await supabase
      .from('workspaces')
      .update({
        name: data.name,
        description: data.description ?? null,
        is_public: data.isPublic,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.workspaceId)
      .select();

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    // RLS silently updates zero rows when the user lacks permission.
    if (workspaces.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to update this workspace');
    }

    return workspaces[0];
  });

export const deleteWorkspaceFunc = createServerFn({ method: 'POST' })
  .inputValidator(workspaceIdValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);
    await requireWorkspaceAccess(supabase, data.workspaceId);

    const { data: deleted, error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', data.workspaceId)
      .select('id');

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    if (deleted.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to delete this workspace');
    }
  });
