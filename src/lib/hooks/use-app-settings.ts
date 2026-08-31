import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@lib/query-keys';
import { getAppSettingsFunc, getAuthSettingsFunc } from '@lib/server-functions/settings';
import type { UseQueryResult } from '@tanstack/react-query';
import type { AppSettings, AuthSettings } from '@lib/server-functions/settings';

export function useAppSettings(): UseQueryResult<AppSettings> {
  return useQuery({
    queryKey: queryKeys.generalAppSettings,
    queryFn: () => getAppSettingsFunc()
  });
}

export function useAuthSettings(): UseQueryResult<AuthSettings> {
  return useQuery({
    queryKey: queryKeys.appAuthSettings,
    queryFn: () => getAuthSettingsFunc()
  });
}
