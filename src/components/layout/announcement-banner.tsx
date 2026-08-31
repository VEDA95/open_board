import { useAppSettings } from '@lib/hooks/use-app-settings';
import { cn } from '@lib/utils/cn';
import type { FC, ReactElement } from 'react';

const TYPE_STYLES: Record<string, string> = {
  info: 'bg-primary/10 text-foreground',
  success: 'bg-emerald-500/15 text-foreground',
  warning: 'bg-amber-500/15 text-foreground',
  error: 'bg-destructive/15 text-foreground'
};

export function AnnouncementBanner(): ReactElement<FC> | null {
  const settingsQuery = useAppSettings();
  const settings = settingsQuery.data;

  if (
    settings == null ||
    !settings.show_announcement_banner ||
    settings.announcement_message == null ||
    settings.announcement_message.trim() === ''
  ) {
    return null;
  }

  return (
    <div
      className={cn(
        'px-4 py-2 text-center text-sm',
        TYPE_STYLES[settings.announcement_type] ?? TYPE_STYLES.info
      )}
    >
      {settings.announcement_message}
    </div>
  );
}
