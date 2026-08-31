import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@lib/query-keys';
import { getAppSettingsFunc } from '@lib/server-functions/settings';
import type { UseQueryResult } from '@tanstack/react-query';
import type { AppSettings } from '@lib/server-functions/settings';

export function useAppSettings(): UseQueryResult<AppSettings> {
  return useQuery({
    queryKey: queryKeys.appSettings,
    queryFn: () => getAppSettingsFunc()
  });
}
