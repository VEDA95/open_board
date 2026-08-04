import { formatDate, profileLabel } from '@lib/utils/format-date';
import type { FC, ReactElement } from 'react';
import type { CardActivityWithAuthor } from '@lib/server-functions/cards';

type ActivityFeedProps = {
  activities: Array<CardActivityWithAuthor>;
};

export function ActivityFeed({ activities }: ActivityFeedProps): ReactElement<FC> {
  if (activities.length === 0) {
    return <p className="text-muted-foreground text-sm">No activity yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {activities.map((activity): ReactElement<FC> => (
        <li key={activity.id} className="text-sm">
          <span className="font-medium">{profileLabel(activity.author)}</span>{' '}
          <span className="text-muted-foreground">{activity.activity}</span>
          <span className="text-muted-foreground/70 ml-1 text-xs">
            {formatDate(activity.created_at)}
          </span>
        </li>
      ))}
    </ul>
  );
}
