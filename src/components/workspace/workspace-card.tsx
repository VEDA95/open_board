import { Link } from '@tanstack/react-router';
import { Badge } from '@components/ui/badge';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@components/ui/card';
import type { FC, ReactElement } from 'react';
import type { Workspace } from '@lib/server-functions/workspaces';

type WorkspaceCardProps = {
  workspace: Workspace;
};

export function WorkspaceCard({ workspace }: WorkspaceCardProps): ReactElement<FC> {
  return (
    <Link
      to="/workspaces/$workspaceId"
      params={{ workspaceId: workspace.id }}
      className="focus-visible:ring-ring rounded-xl focus-visible:ring-2 focus-visible:outline-none"
    >
      <Card className="hover:bg-accent/50 h-full transition-colors">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="truncate">{workspace.name}</CardTitle>
            <Badge variant={workspace.is_public ? 'secondary' : 'outline'}>
              {workspace.is_public ? 'Public' : 'Private'}
            </Badge>
          </div>
          {workspace.description != null && workspace.description !== '' && (
            <CardDescription className="line-clamp-2">{workspace.description}</CardDescription>
          )}
        </CardHeader>
      </Card>
    </Link>
  );
}
